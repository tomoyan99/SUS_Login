"use strict";
/* 
	[makeSchedule関数]
	sclassの学生時間割を参照して、その人が履修している科目の科目コードから、solaの科目ページurlを取得し、sola_link.jsonを作成
*/

import {today} from './today.js';
import {control as cl} from "./control.js";
import {sleep, writeJSON} from "./myUtils.js";
import {openContext, openSclass, openSola} from "../puppeteer/Openers.js";

export async function makeSchedule(data) {
	data.last_upd = {
		year 	: today.year,
		month	: today.month,
		date 	: today.date,
		value   : today.value,
		lastterm: today.whichTerm()
	};
		/* ブラウザの立ち上げ */
	let context;
	try{
		context = await openContext("EUC");
	}catch (e) {
		this.event.emit("error","[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
		return;
	}
	try {
		const sclass_schedule = await searchSclass(context, data.user);
		console.log("続いて、SOLAから科目ページリンクの取得を行います");
		const marge_schedule = await searchSola(context, data.user, sclass_schedule);
		console.log("履修科目データの登録が完了しました");
		await context.close();
		return marge_schedule;
	}catch (e){
		await context.close();
		throw e;
	}
}

async function searchSclass(browser, user) {
		const page = await openSclass(browser,user,true);
		const target_risyuu_ID = "div#pmenu4"; //sclassの上のバーの「履修関連」

		try {
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
			return schedule;
		}catch (e){
			throw e;
		}
}

async function searchSola(browser, user, schedule) {
	const context = await browser.createIncognitoBrowserContext();
	await context.newPage();
	await (await browser.pages())[0].close();
	try {
		//一回solaを開いておくことでログイン状態を保持
		await openSola(context,user,true);
		//前期科目ページURL取得
		await Promise.all(
			schedule.bf.map(async (t, i) => {
				await sleep(i * 800);
				t.event = "sola";
				t.url = await sola_scrp(context, t);
			})
		);
		console.log(cl.fg_green + "前期科目ページURL取得完了" + cl.fg_reset);
		//後期科目ページURL取得
		await Promise.all(
			schedule.af.map(async (t, i) => {
				await sleep(i * 800);
				t.event = "sola";
				t.url = await sola_scrp(context, t);
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
	}catch (e) {
		await browser.close();
		throw e;
	}
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