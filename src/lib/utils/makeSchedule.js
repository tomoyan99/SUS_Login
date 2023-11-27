"use strict";
/* 
	[makeSchedule関数]
	sclassの学生時間割を参照して、その人が履修している科目の科目コードから、solaの科目ページurlを取得し、sola_link.jsonを作成
*/

import {launch} from 'puppeteer'; //pupeteerのインポート
import {today} from './today.js';
import {control as cl} from "./control.js";
import {sleep, writeJSON} from "./myUtils.js";

export async function makeSchedule(data) {
	data.last_upd = { year: today.year, month: today.month, date: today.date,value:today.value,lastterm:today.whichTerm()};
	/* ブラウザの立ち上げ */
	const browser = await launch({
		// headless: false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
		headless: "new", //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
		slowMo: 5, //タイピング・クリックなどの各動作間の速度
		defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
		channel: "chrome",//chromeを探し出して開く
	});
	try {
		const sclass_schedule = await searchSclass(browser, data);
		const marge_schedule = await searchSola(browser, data, sclass_schedule);
		console.log("履修科目データの登録が完了しました");
		return marge_schedule;
	}catch (e){
		throw e;
	}
}

async function searchSclass(browser, data) {
	const user_name = data.user.name;
	const password = data.user.password;

	const page = await browser.newPage();//新規ページを作成

	const url = "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp"; //sclassのurl

	// CSSをOFFにして高速化
	await page.setRequestInterception(true);
	page.on('request', (request) => {
		if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
			request.abort();
		} else {
			request.continue();
		}
	});
	try {
		await page.goto(url, { waitUntil: 'load', timeout: 0 }); //sclassに遷移

		const target_name_ID = ".inputText";//username入力要素のID
		const target_pass_ID = ".inputSecret";//password入力要素のID
		const target_submit_ID = "input[type=image]";//submitボタンのID

		(await browser.pages())[0].close();
		await page.waitForSelector(target_submit_ID, { timeout: 10000 });
		await page.click(target_submit_ID);//submitクリック
		await page.waitForSelector(target_name_ID, { timeout: 10000 });
		await page.type(target_name_ID, user_name);//username入力
		await page.waitForSelector(target_pass_ID, { timeout: 10000 });
		await page.type(target_pass_ID, password);//password入力
		await Promise.all([
			page.waitForSelector(target_submit_ID, { timeout: 10000 }),
			page.click(target_submit_ID)//submitクリック
		]);
		console.log(cl.bg_green+"sclassログイン完了"+cl.bg_reset);
		const target_risyuu_ID = "div#pmenu4"; //sclassの上のバーの「履修関連」

		await page.evaluate(() => { window.scroll(0, 0); });
		await page.waitForSelector(target_risyuu_ID, { visible: true, timeout: 10000 });
		await page.hover(target_risyuu_ID);//「履修関連」をホバー
		const target_studentSchedule_ID = await page.$eval(target_risyuu_ID,(div)=>{
			return `#${Array.from(div.children).filter((c) => c.text === "学生時間割表")[0].id}`
		});
		await page.waitForSelector(target_studentSchedule_ID, { visible: true, timeout: 10000 });
		await page.click(target_studentSchedule_ID, { delay: 1000 });//授業時間割をクリック
		const target_select_viewstyle_ID = "select#form1\\3A HyojiKeishiki"; //表示形式選択のID
		const target_select_term_ID = "select#form1\\3A htmlGakki"
		const target_search_ID = "input#form1\\3A search";//検索ボタンのID

		await page.waitForSelector(target_select_viewstyle_ID, { visible: true, timeout: 10000 });
		await page.select(target_select_viewstyle_ID, "1");//一覧形式の選択
		await page.select(target_select_term_ID, "0");//一覧形式の選択
		await page.click(target_search_ID);//submitをクリック

		//一覧形式のtableの表示を待つ
		const table_list_bf_ID = "table#form1\\3A standardJugyoTimeSchedule00List";
		await page.waitForSelector(table_list_bf_ID, { visible: true, timeout: 10000 });
		//一覧形式のtableの表示を待つ
		const table_list_af_ID = "table#form1\\3A standardJugyoTimeSchedule01List";
		await page.waitForSelector(table_list_af_ID, { visible: true, timeout: 10000 });

		async function evalSUS(classname, page) {
			const path_bf = `table#form1\\3A standardJugyoTimeSchedule00List td.${classname} span`;
			const path_af = `table#form1\\3A standardJugyoTimeSchedule01List td.${classname} span`;
			return {
				"bf": Array.from(new Set(
					await page.$$eval(path_bf, (tds) => {
						return tds.map(data => data.textContent)
					})
				)),
				"af": Array.from(new Set(
					await page.$$eval(path_af, (tds) => {
						return tds.map(data => data.textContent)
					})
				))
			};
		}

		// //授業コードを取得
		let class_code = await evalSUS("jugyoCd", page);

		// //授業名を取得
		let class_name = await evalSUS("jugyoMei", page);

		let schedule = { bf: [], af: [] };


		//前期分を整形してScheduleに格納
		for (let i = 0; i < class_code.bf.length; i++) {
			schedule.bf.push({
				code: class_code.bf[i],
				name: class_name.bf[i].replace(/ (.*?) .*/g, "$1").replace('\t', "")
			});
		}
		//後期分を整形してScheduleに格納
		for (let i = 0; i < class_code.af.length; i++) {
			schedule.af.push({
				code: class_code.af[i],
				name: class_name.af[i].replace(/ (.*?) .*/g, "$1").replace('\t', "")
			});
		}
		console.log(cl.fg_green+"履修科目コード及び科目名取得完了"+cl.fg_reset);
		console.log("続いて、SOLAから科目ページリンクの取得を行います");
		return schedule;
	} catch (e) {
		console.log(e)
		throw new Error(cl.fg_red + "[保存] データの保存に失敗しました。暗号化にバグが生じている可能性があります" + cl.fg_reset);
	}
}

async function searchSola(browser, data, schedule) {
	const user_name = data.user.name;
	const password = data.user.password;
	const url = "https://sola.sus.ac.jp"//solaのurl


	const page = await browser.newPage();//新規ページを作成
	await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });//ページ遷移

	const target_name_ID = "#identifier"; //username入力要素のID
	const target_pass_ID = "#password"; //password入力要素のID
	const target_submit_ID = "button[type=submit]"; //submitボタンのID
	const target_a_ID = "a#a-2"; //solaのリンクのID

	const pages = await browser.pages(); //ページリスト取得(Exitcポータルの削除のため)
	await pages[0].close();//about:brankを削除

	await page.waitForSelector(target_name_ID, { visible: true, timeout: 30000 });
	await page.type(target_name_ID, user_name);//username入力
	await page.click(target_submit_ID);//submitクリック
	await page.waitForSelector(target_pass_ID, { visible: true, timeout: 30000 });
	await page.type(target_pass_ID, password);//password入力
	await page.click(target_pass_ID, { delay: 800 });//passwordクリック(確実にsubmitするため)
	await page.click(target_submit_ID);//submitクリック

	const SOLA = await browser.waitForTarget(async (target) => {
		if (target.url() === "https://sola.sus.ac.jp/") {
			return target;
		}
	});
	console.log(cl.bg_green+"SOLAログイン完了"+cl.bg_reset);
	// ここからSOLAが開かれたあとの処理

	await Promise.all(
		schedule.bf.map(async (t, i) => {
			await sleep(i * 800);
			t.event = "sora";
			t.url = await sola_scrp(browser, t);
		})
	);
	console.log(cl.fg_green + "前期科目ページURL取得完了" + cl.fg_reset);
	await Promise.all(
		schedule.af.map(async (t, i) => {
			await sleep(i * 800);
			t.event = "sora";
			t.url = await sola_scrp(browser, t);
		})
	);
	const formated_schedule = {
		"前期":{},
		"後期":{}
	};
	for (const scheduleKey in schedule) {
		for (const elem of schedule[scheduleKey]) {
			formated_schedule[(scheduleKey==="bf")?"前期":"後期"][elem.name]
				= {
				"name": elem.name,
				"event": elem.event,
				"code": elem.code,
				"url": elem.url
			}
		}
	}

	console.log(cl.fg_green + "後期科目ページURL取得完了" + cl.fg_reset);
	await browser.close();

	return formated_schedule;
}

async function sola_scrp(browser, data) {
	//cssを非表示
	const page2 = await browser.newPage();
	await page2.setRequestInterception(true);
	page2.on('request', (request) => {
		if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
			request.abort();
		} else {
			request.continue();
		}
	});
	//solaに飛ぶ
	await page2.goto("https://sola.sus.ac.jp/course/search.php?areaids=core_course-course&q=" + data.code, { waitUntil: 'domcontentloaded', timeout: 0 });
	
	await page2.waitForSelector("div.last a.aalink", { visible: true, timeout: 2000 }).catch(() => {
		return "https://sola.sus.ac.jp/";
	});
	
	//aのhrefから一番下にあるやつをとってくる
	const url = await page2.$eval("div.last a.aalink", (tar) => {
		//通年科目とかの年度名が書いてあるかどうか
		return tar.href;
	}).catch(() => {
		//URLが存在しなかったらSOLAのページへ
		return "https://sola.sus.ac.jp/";
	});
	const nend = await page2.$eval("div.last a.aalink", (tar) => {
		//通年科目とかの年度名が書いてあるかどうか
		return parseInt(tar.textContent.match(/[0-9][0-9]_/)[0].replace(/_/, ""));
	}).catch(() => {
		return null;
	});
	await page2.close();
	// console.log(nend + "," + today.getNend());
	if (nend === null || nend === today.getNend()) {
		//年度が同じなら
		console.log(url);
		return url;
	} else if (nend !== today.getNend()) {
		//年度が違ったら
		return "https://sola.sus.ac.jp/";
	}
}