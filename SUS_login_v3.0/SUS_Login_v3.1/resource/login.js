"use strict";
/* 
	[SUS_login]
	諏訪理科のsola,sclassに自動ログインしたり、eucを自動で入力してくれるスクリプト。
*/

/* 
	使用モジュール
		puppeteer:自動入力やクリックを担う
		readline :標準入力の受け取り
		fs       :jsonファイルの取り込み
		os       :ホスト名の取得
		crypt.js :info.jsonの暗号・復号
		existChromePath.js :ローカルにChromeが存在するか
		input.js :標準入力全般。パスワードの入力にも用いる
		choice.js:選択肢の表示とキー選択
		makeSchedule :sola_link.jsonの作成とタイムスタンプの更新
		today.js :日付関連モジュール
		control.js :コンソールの色等の制御
*/
import { launch } from 'puppeteer';//pupeteerのインポート
import { readFileSync, existsSync, writeFileSync, appendFileSync } from 'fs';//fsのインポート
import { hostname } from 'os'; //ホスト名の取得
import { crypt } from './util/crypt.js'; //暗号化
import {existChromePath} from './util/existChromePath.js'; //chromeが入っているかの確認
import {input} from './util/input.js'; //標準入力・パス入力
import {choice} from "./util/choise.js"; //十字キー選択
import {makeSchedule} from './util/makeSchedule.js';
import { today } from './util/today.js';
import { control as cl } from "./util/control.js";

/* sleep関数 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

/* writeJSON関数 */
function writeJSON(dir, data) {
	writeFileSync(dir, JSON.stringify(data));
}

/* 
	login関数 
	ここでは開きたいサイトのコマンドを標準入力で受け取ったり、
	openSUS関数の実行をしたりしてます。
*/
export async function login(version) {
	/* 
		十字キー選択によって、[sclass],[sola],[sclass,sola],[euc]の判定を行い、
		eucならさらに番号の入力を求める。
		[list]を選択すると履修中の科目リストが表示され、選択すると対応したsolaのページurlを設定
		エラーがなければopenSUSを実行する。
	*/
	let EUC = 0;//EUC番号を格納する変数

	const data = await input_name_and_pass(version);//初回起動なら学籍番号とパスワードを入力 info.jsonの中身をdataに格納
	//データのパースエラーが起きたら終了
	if (data === 1) {
		return;
	}
	/* 前期後期の入れ替わり(4月と10月)にsola_link.jsonの更新 */
	if (today.isStartNend(data.last_upd) === true) {
		console.clear();
		console.log("期を跨いだので履修科目データの更新を行います");
		await sleep(1500);
		console.log(cl.fg_yellow + "※ 科目データの更新には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい" + cl.fg_reset);
		const sola_link = await makeSchedule(data).catch(()=>{
			throw new Error(`${cl.fg_red}\n科目データの更新に失敗しました。${cl.fg_reset}\nネットワークの接続状況を確認して、再実行してください。それでも失敗するようでしたら、${cl.fg_cyan}infoClear.exe${cl.fg_reset}を実行して初期化ののちもう一度最初から登録を行ってください。\n`);
		});//info.jsonの情報を引数に
		writeFileSync("resource/data/info.json", await crypt.encrypt(JSON.stringify(data), await crypt.strToDec(hostname())));//info.jsonを暗号化して書き込み
		writeJSON("resource/data/sola_link.json",sola_link);//sola_link.jsonを作成
	}
	//sola_link.jsonの中身
	const sola_link = new Object(JSON.parse(readFileSync("resource/data/sola_link.json")));
	let page_name = {"bf":[],"af":[]};//sola_linkから科目名のみ取り出し
	let page_url = {"bf":[],"af":[]};//sola_linkからurlのみ取り出し
	let page_link = {};
	
	/* コピー実行部 */
	page_name.bf = sola_link.bf.map((d)=>d.name);
	page_name.af = sola_link.af.map((d)=>d.name);
	page_url.bf = sola_link.bf.map((d)=>d.url);
	page_url.af = sola_link.af.map((d)=>d.url);
	/* 科目名をキー、 値をurlとしたテーブルの作成*/
	//前期
	for (let i = 0; i < sola_link.bf.length; i++) {
		page_link[page_name.bf[i]] = page_url.bf[i];
	}
	//後期
	for (let i = 0; i < sola_link.af.length; i++) {
		page_link[page_name.af[i]] = page_url.af[i];
	}

	//選択用のargs
	let main_option = {
		head: [`SUS_login_v3.1\n${cl.fg_green}十字キーで開きたい項目を選択してね${cl.fg_reset}\n\n`],
		main: [["1.euc"], ["2.sola", ">>List"], ["3.sclass"], ["4.sclassとsola"]],
		bottom: ["選択?>"]
	}
	//選択
	let state = await choice(main_option);
	//コマンドリスト
	let comlist = [[["euc"]],[["sola"],["list"]],[["sclass"]],[["sclass", "sola"]]];
	//コマンドリストの中からどれを選んだか
	let whichOpen = comlist[state.chosing().index[0]][state.chosing().index[1]];

	//選んだのがlistだったら
	if (whichOpen[0] == "list") {
		//前期のoptionリスト
		main_option.bf = {
			head: [`前期solaリンク選択はぁと${cl.fg_red}♥${cl.fg_reset}\n\n`],
			main: page_name.bf.map((d) => [d]),
			bottom: ["\n選択?>"]
		}
		//後期のoptionリスト
		main_option.af = {
			head: [`後期solaリンク選択はぁと${cl.fg_red}♥${cl.fg_reset}\n\n`],
			main: page_name.af.map((d) => [d]),
			bottom: ["\n選択?>"]
		}
		//前後期選択肢の末尾に前期後期切り替えページ用の選択肢を挿入
		main_option.bf.main.push([`${cl.fg_green}>>後期ページへ${cl.fg_reset}`]);
		main_option.af.main.push([`${cl.fg_green}>>前期ページへ${cl.fg_reset}`]);
		//前期を先に開く
		state = await choice(main_option.bf);
		while (true) {
			//ページの選択をしたときはループ
			if (state.chosing().str === `${cl.fg_green}>>後期ページへ${cl.fg_reset}`) {
				state = await choice(main_option.af);
			} else if (state.chosing().str === `${cl.fg_green}>>後期ページへ${cl.fg_reset}`) {
				state = await choice(main_option.bf);
			}else{
				//ページの選択以外の科目ページを選択したら、起動コマンドをsolaにし、solaのurlを対応する科目ページのurlにする
				whichOpen = ["sola"];
				data.sola.url = page_link[state.chosing().str];
				break;
			}
		}
	}

	if (whichOpen[0] === "euc") { //eucが入力されたならeuc番号を聞く
		EUC = await input("euc?>");
	}
	await openSUS(whichOpen, EUC, data);//openSUSを実行
};


//初回起動設定
async function input_name_and_pass(version) {
	const cpname = hostname();
	//chromeがインストールされているかの判定
	if (!existChromePath().length) {
		console.log(cl.fg_red + "[ERROR]" + cl.fg_reset);
		console.log(cl.fg_red + "chromeがインストールされていません！" + cl.fg_reset);
		console.log(cl.fg_green + "C:\\Program Files\\" + cl.fg_red + "以下などにchromeをインストールしてから再起動してください!" + cl.fg_reset);
		console.log("chrome公式ページのURL→" + cl.fg_cyan + "[https://www.google.com/intl/ja_jp/chrome/]" + cl.fg_reset);
		process.exit();
	}
	try {
		let data_can_write = JSON.parse(readFileSync('resource/data/info.json', "utf-8")); //info.jsonの取り込み
		console.log("初回起動を確認しました・・・");
		await sleep(1000);
		console.clear();
		console.log("OpenSUS_v" + version + " へようこそ！");
		console.log("ユーザー名(学籍番号)とパスワードの設定を行います。");
		//学籍番号の入力
		const NAME = await input("UserName?>", false);
		//パスワードの入力。二回入力させて間違っていれば再入力
		await (async function inputNamePass() {
			const PAWO1 = await input("PassWord?>", true);
			console.log("確認のためもう一度パスワードを入力してください");
			const PAWO2 = await input("PassWord?>", true);
			if (PAWO1 === PAWO2) {
				data_can_write.username = NAME; //usernameの追加
				data_can_write.password = PAWO1; //passwordの追加	
				return;
			} else {
				console.log("パスワードが一致しません。もう一度入力してください");
				await sleep(1000);
				// console.clear();
				await inputNamePass();
				return;
			}
		})().then(() => {
			console.log("ユーザー名及びパスワードを登録しました");
		}).catch(() => {
			console.log(cl.fg_red + "[登録エラー] ユーザー名及びパスワードの登録に失敗しました。もう一度再起動してください" + cl.fg_reset);
			process.exit();
		});
		await sleep(500);

		/* 履修データの登録 */
		console.log("続いて、履修科目データの登録を行います");
		console.log(cl.fg_yellow+"※ 科目データの登録には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい"+cl.fg_reset);
		/* makeSchedule関数：resource/data/sola_link.jsonの作成 */
		const sola_link = await makeSchedule(data_can_write).catch(() => {
			console.log(cl.fg_red + "[登録エラー] 履修科目データの登録に失敗しました。パスワードなどが正しいか確認してもう一度やり直してください" + cl.fg_reset);
			process.exit();
		});
		console.log("認証ファイルの暗号化を行います・・・");
		writeFileSync("resource/data/info.json", await crypt.encrypt(JSON.stringify(data_can_write), await crypt.strToDec(cpname)));//info.jsonを暗号化して書き込み
		await sleep(3000);
		writeJSON("resource/data/sola_link.json", sola_link);
		console.log("\n設定が完了しました。次回起動時から本機能が使用可能になります。");
		return 1;
	} catch (e) {
		//info.jsonがすでに暗号化されていてjsonとして取り込めなかったとき
		const data_read_only = readFileSync('resource/data/info.json', "utf-8"); //info.jsonの取り込み
		return JSON.parse(await crypt.decrypt(data_read_only, await crypt.strToDec(cpname)));//info.jsonの中身を復号して変換
	}
};
/* 
	openSUS関数
	main関数で入力されたコマンドに対応するサイトを開き、自動操縦を行う。
	EUCが選択されたときはヘッドレス。
*/
async function openSUS(whichOpen, EUC, data) {
		/* ブラウザの立ち上げ */
		const browser = await launch({
			headless: (whichOpen[0] === "euc") ? true : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
			slowMo: (whichOpen[0] === "euc") ? 0 : 2, //タイピング・クリックなどの各動作間の速度
			defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
			channel: "chrome",//chromeを探し出して開く
			ignoreHTTPSErrors: true,
			ignoreDefaultArgs: [
				"--disable-extensions",
				"--enable-automation",
			],
		}).catch(()=>{
			throw new Error(cl.fg_red+"ブラウザが開きませんでした。chromeがインストールされていることを確認してください。"+cl.bg_reset);
		});
	const pages = await browser.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
	const context = await browser.createIncognitoBrowserContext();//シークレットモードで開くため
	
	const promis_list = [];
	//[sclass,sola]だった場合どっちも起動
	whichOpen.forEach((site) => {
		/* sclassのとき */
		if (site === "sclass") {
			// await openSclass(browser,data);
			promis_list.push(openSclass(context, data));
		}
		/* solaのとき */
		if (site === "sola") {
			// await openSola(browser,data);
			promis_list.push(openSola(context, data));
		}
		/* eucのとき */
		if (site === "euc") {
			// await openEuc(browser,data,EUC);
			promis_list.push(openEuc(context, data, EUC));
		}
	});
	await pages[0].close();//about:brankを削除
	await Promise.all(promis_list);
}

async function openSclass(browser,data) {
	const info = data.sclass;//dataからsclassの情報を取得
	const user_name = data.username;
	const password = data.password;
	//新規ページを開く
	const page = await browser.newPage();

	const url = info.url;//sclassのurl

	await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 }); //ページ遷移

	const target_name_ID = info.target.name; //username入力要素のID
	const target_pass_ID = info.target.pass; //password入力要素のID
	const target_submit_ID = info.target.submit; //submitボタンのID

	await page.waitForSelector(target_submit_ID, { visible: true, timeout: 10000 });
	await page.click(target_submit_ID); //submitクリック
	await page.waitForSelector(target_name_ID, { visible: true, timeout: 10000 });
	await page.click(target_name_ID); //usernameクリック
	await page.type(target_name_ID, user_name); //username入力
	await page.waitForSelector(target_pass_ID, { visible: true, timeout: 10000 });
	await page.click(target_pass_ID); //passwordクリック
	await page.type(target_pass_ID, password); //password入力
	await page.waitForSelector(target_submit_ID, { visible: true, timeout: 10000 });
	await page.click(target_submit_ID); //submitクリック
	return;
}

async function openSola(browser,data) {
	const info = data.sola; //dataからsolaの情報を取得
	const user_name = data.username;
	const password = data.password;

	const page = await browser.newPage();//新規ページを作成

	const url = info.url;//solaのURL

	await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });//ページ遷移

	const target_name_ID = info.target.name; //username入力要素のID
	const target_pass_ID = info.target.pass; //password入力要素のID
	const target_submit_ID = info.target.submit; //submitボタンのID

	await page.waitForSelector(target_name_ID, { visible: true, timeout: 30000 });
	await page.type(target_name_ID, user_name);//username入力
	await page.click(target_submit_ID);//submitクリック
	await page.waitForSelector(target_pass_ID, { visible: true, timeout: 30000 });
	await page.type(target_pass_ID, password);//password入力
	await page.click(target_pass_ID, { delay: 800 });//passwordクリック(確実にsubmitするため)
	await page.click(target_submit_ID);//submitクリック
	return;
}

async function openEuc(browser,data,EUC) {

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

	await page.goto(url, { waitUntil: 'networkidle2' , timeout: 0 }); //sclassに遷移

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
	const target_euc1_ID = "a#menuimg4-4"; //sclassの履修関連の中のEUC

	await page.evaluate(() => { window.scroll(0, 0); });
	await page.waitForSelector(target_risyuu_ID, { visible: true, timeout: 10000 });
	await page.hover(target_risyuu_ID),//「履修関連」をホバー
		await page.waitForSelector(target_euc1_ID, { visible: true, timeout: 10000 });
	await page.hover(target_euc1_ID);//EUCをホバー
	await page.click(target_euc1_ID, { delay: 400 });//EUCをクリック

	const target_eucIn_ID = "input.inputText"; //EUC入力要素のID
	const target_eucSubmit_ID = "input.button";//EUCsubmitボタンのID

	await page.waitForSelector(target_eucIn_ID, { visible: true, timeout: 10000 });
	await page.type(target_eucIn_ID, EUC);//EUCの入力

	page.on("dialog", async dialog => {
		await dialog.accept(); // OK
	});

	await page.click(target_eucSubmit_ID);//submitをクリック
	await page.waitForSelector("td span.outputText", { timeout: 10000 });

	//EUC登録した授業名を取得
	const nam = await page.$eval("td span#form1\\3A Title", (tar) => {
		return tar.textContent.replace(/[\t\n]/g, "");
	}).catch(() => {
		return "";
	});
	//EUC登録の結果の文章を取得
	const tex = await page.$eval("td span#form1\\3A htmlTorokukekka", (tar) => {
		return tar.textContent;
	});
	console.log(cl.fg_cyan + nam + "\n" + cl.fg_reset + cl.fg_red + tex + cl.fg_reset); //結果をコンソールに表示
	//「文章が異なります。」が出なかったらスクショ
	if (tex !== "番号が異なります。") {
		const shot_target = await page.$("table.sennasi");
		const filename = today.getToday();
		await shot_target.screenshot({
			path: "images/" + nam + "_" + filename + ".jpg",
			type: 'jpeg',
			// fullPage: true,
			quality: 100
		});
		// /logs/euc.logファイルがあるか判定。なければ作成あったら追記
		const todayEUC = `授業名：${nam},日付：${today.getTodayJP()},EUC番号：${EUC},結果：${tex}\n`;
		if (!existsSync("logs/euc.log")) {
			writeFileSync("logs/euc.log", todayEUC, "utf-8");
		} else {
			try {
				appendFileSync("logs/euc.log", todayEUC, "utf-8");
			} catch (e) {
				console.log(cl.fg_red + "logs/euc.logにEUCを書き込めませんでした。" + cl.fg_reset);
			}
		}
	}

	await browser.close();
}