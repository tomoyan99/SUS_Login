"use strict";
/* 
	[makeSchedule関数]
	sclassの学生時間割を参照して、その人が履修している科目の科目コード、科目名を取得
*/

const puppeteer = require('puppeteer');//pupeteerのインポート
const fs = require('fs');//fsのインポート
const {crypt} = require('../util/crypt');
const os = require('os');
const marge = require('marge');
const {today} = require('../util/today');

/* グローバル変数 */

/* sleep関数 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
/* writeJSON関数 */
function writeJSON(dir, data) {
	fs.writeFileSync(dir, JSON.stringify(data));
}

async function makeSchedule(data) {
	data.last_upd = { year: today.year, month: today.month, date: today.date };
	/* ブラウザの立ち上げ */
	const browser = await puppeteer.launch({
		headless: "new", //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
		slowMo:5, //タイピング・クリックなどの各動作間の速度
		defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
		channel: "chrome",//chromeを探し出して開く
	});
	const sclass_schedule = await searchSclass(browser, data);
	const marge = await searchSola(browser,data,sclass_schedule);

	// if (fs.existsSync("resource/data/schedule.json") || fs.existsSync("resource/data/subject.json")) {
	// 	await marge();
	// }
	return;
};

async function searchSclass(browser,data) {
	const info = data.sclass; //sclassのデータを取得
	const user_name = data.username;
	const password = data.password;

	const page = await browser.newPage();//新規ページを作成

	const url = info.url; //sclassのurl

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
		
		const target_name_ID = info.target.name;//username入力要素のID
		const target_pass_ID = info.target.pass;//password入力要素のID
		const target_submit_ID = info.target.submit;//submitボタンのID
		
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
		
		const target_risyuu_ID = "a#menuc4"; //sclassの上のバーの「履修関連」
		const target_euc1_ID = "a#menuimg4-1"; //sclassの履修関連の中の授業時間割
		
		await page.evaluate(() => { window.scroll(0, 0); });
		await page.waitForSelector(target_risyuu_ID, { visible: true, timeout: 10000 });
		await page.hover(target_risyuu_ID),//「履修関連」をホバー
		await page.waitForSelector(target_euc1_ID, { visible: true, timeout: 10000 });
		await page.hover(target_euc1_ID);//授業時間割をホバー
		await page.click(target_euc1_ID, { delay: 400 });//授業時間割をクリック
		
		// console.log("in!!!!");
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
			const array = {
				"bf": Array.from(new Set(
					await page.$$eval(path_bf, (tds) => { return tds.map(data => data.textContent) })
				)),
				"af": Array.from(new Set(
					await page.$$eval(path_af, (tds) => { return tds.map(data => data.textContent) })
				))
			};
			return array;
		}

		// //授業コードを取得
		let class_code = await evalSUS("jugyoCd", page);

		// //授業名を取得
		let class_name = await evalSUS("jugyoMei", page);
		
		let schedule = { bf: [], af: [] };
		
		await browser.close();
		
		//前期分を整形してScheduleに格納
		for (let i = 0; i < class_code.bf.length; i++) {
			schedule.bf.push({
				class_code: class_code.bf[i],
				class_name: class_name.bf[i].replace(/ (.*?) .*/g, "$1").replace('\t', "")
			});
		}
		//後期分を整形してScheduleに格納
		for (let i = 0; i < class_code.af.length; i++) {
			schedule.af.push({
				class_code: class_code.af[i],
				class_name: class_name.af[i].replace(/ (.*?) .*/g, "$1").replace('\t', "")
			});
		}

		return schedule;
		// writeJSON("resource/data/schedule.json", schedule);
		
		// const cpname = os.hostname();
		// console.log("データを保存しています・・・");
		// fs.writeFileSync("resource/data/info.json", await crypt.encrypt(JSON.stringify(data), await crypt.strToDec(cpname)));//info.jsonを暗号化して書き込み
		// console.log("保存が完了しました");
	} catch (e) {
		// throw new Error(red + "[保存] データの保存に失敗しました。暗号化にバグが生じている可能性があるため、暇なときにでも佐野まで報告してもらえると助かります(笑)" + reset)
		console.log(e);
	}
}

async function searchSola(browser,data,schedule) {

	async function sola_scrp(url2, id) {
		const page2 = await browser.newPage();
		await page2.setRequestInterception(true);
		page2.on('request', (request) => {
			if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
				request.abort();
			} else {
				request.continue();
			}
		});
		try {
			await page2.goto(url2 + "course/view.php?id=" + id, { waitUntil: 'domcontentloaded', timeout: 0 });
			await page2.waitForSelector("h1");
			const title = await page2.$eval("h1", (tar) => {
				return tar.textContent;
			});
			await page2.close();
			let nend = "";
			if (title !== "" && title !== "SOLA") {
				nend = "20" + title.slice(0, 2) + "年度";
			} else {
				title = "";
				id = "";
			}
			return { "id": id, "nend": nend, "title": title };
		} catch (error) {
			if (!page2.isClosed()) {
				await page2.close();
			}
			return "";
		}
	}

	const info = data.sola; //dataからsolaの情報を取得
	const page = await browser.newPage();//新規ページを作成
	const url = "https://sola.sus.ac.jp/course/search.php?areaids=core_course-course&q="//solaのurl

	await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });//ページ遷移

	const target_name_ID = info.target.name; //username入力要素のID
	const target_pass_ID = info.target.pass; //password入力要素のID
	const target_submit_ID = info.target.submit; //submitボタンのID
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
	await page.waitForSelector(target_a_ID, { visible: true, timeout: 30000 });
	await page.click(target_a_ID);//aクリック
	// ポータルサイトをページタイトルから判定して削除
	pages.forEach(async (p) => {
		if (await p.title() === "アカウント") {
			await p.close();
		}
	});
	
	// ここからSOLAが開かれたあとの処理
	// await browser.close();
	let pm_list = [];
	const onetime_pages = 10;
	let iteration = 0;
	if (today.whichTerm === "bf") {
		iteration = schedule.bf.length;
	} else if (today.whichTerm === "af") {
		iteration = schedule.bf.length + schedule.af.length;
	}

	for (let i = 0; i < iteration; i += onetime_pages) {
		const id_list = Array(onetime_pages);
		const li = await Promise.all(
			id_list.map(async (id, index) => {
				await sleep((index + 1) * 1000);
				console.log(i + " , " + index + " , " + "open");
				return await sola_scrp(SOLA.url(), id);
			})
		);
		pm_list = pm_list.concat(li);
		// await sleep(2000);
	}
	pm_list = pm_list.filter(Boolean);
	console.log(pm_list.filter(Boolean));
	// fs.writeFileSync("resource/subjects.json", JSON.stringify(pm_list));
	return pm_list;
	
}


makeSchedule();