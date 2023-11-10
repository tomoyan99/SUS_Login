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
*/
const puppeteer = require('puppeteer');//pupeteerのインポート
const fs = require('fs');//fsのインポート
const os = require('os'); //ホスト名の取得
const { crypt } = require('./util/crypt'); //暗号化
const existChromePath = require('./util/existChromePath'); //chromeが入っているかの確認
const input = require('./util/input'); //標準入力・パス入力
const choice = require("./util/sentaku"); //十字キー選択
const makeSchedule = require('./util/makeSchedule');
const {today} = require('./util/today');

/* グローバル変数 */

/* 制御文字一覧 */
const black = '\x1b[30m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const magenta = '\x1b[35m';
const cyan = '\x1b[36m';
const white = '\x1b[37m';
const reset = '\x1b[0m';

const rightClear = "\x1b[0K";//カーソルより右側消去
const startLine = (r = 1, n = 1) => `\x1b[${r};${n}H`;//スタート位置の決定


/* sleep関数 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

/* 
	login関数 
	ここでは開きたいサイトのコマンドを標準入力で受け取ったり、
	openSUS関数の実行をしたりしてます。
*/
module.exports = async function login(version) {
	/* 
		十字キー選択によって、[sclass],[sola],[sclass,sola],[euc]の判定を行い、
		eucならさらに番号の入力を求める。
		間違いなどがなければopenSUSを実行する。
	*/
	let EUC = 0;//EUC番号を格納する変数
	
	// imagesフォルダがあるか判定。なければ作成
	if (!fs.existsSync("../images")) {
		fs.mkdirSync("../images");
	}
	// logsフォルダがあるか判定。なければ作成
	if (!fs.existsSync("../logs")) {
		fs.mkdirSync("../logs");
	}
	// dataフォルダがあるか判定。なければ作成
	if (!fs.existsSync("./data")) {
		fs.mkdirSync("./data");
	}
	
	const data = await input_name_and_pass();//初回起動なら学籍番号とパスワードを入力
	if (today.isStartNend(data.last_upd) === true) {
		await makeSchedule(data);

	}
	
	//選択用のargs
	let state = {
		option: ["ダミー", "1.euc", "2.sola","3.sclass","4.sclassとsola"],
		index: 1,//選択している行数
		start: 4, //開始行数
	};
	//選択
	const choose = await(async () => {
		console.clear();	
		console.log("SUS_Login_v"+version);
		console.log(`${green}十字キーで開きたい項目を選択してね${reset}\n`);
		for (let i = 1;i<state.option.length;i++){
			console.log(`${state.option[i]}`);
		}
		await choice("選択?>", state);
		return state.index;
	})();


	let whichOpen = {
		"1": ["euc"],
		"2": ["sola"],
		"3": ["sclass"],
		"4": ["sclass", "sola"],
	};
	console.log(whichOpen[choose]);
	if (whichOpen[choose][0] === "euc") { //eucが入力されたならeuc番号を聞く
		EUC = await input("euc?>");
	}
	await openSUS(whichOpen[choose], EUC, data);//openSUSを実行
};


//初回起動設定
async function input_name_and_pass() {
	const cpname = os.hostname();
	//chromeがインストールされているかの判定
	if (!existChromePath().length) {
		console.log(red + "[ERROR]" + reset);
		console.log(red + "chromeがインストールされていません！" + reset);
		console.log(green + "C:\\Program Files\\" + red + "以下などにchromeをインストールしてから再起動してください!" + reset);
		console.log("chrome公式ページのURL→" + cyan + "[https://www.google.com/intl/ja_jp/chrome/]" + reset);
		process.exit();
	}
	try {
		let data_can_write = JSON.parse(fs.readFileSync('resource/data/info.json', "utf-8")); //info.jsonの取り込み
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
				console.clear();
				await inputNamePass();
				return;
			}
		})().then(() => {
			console.log("ユーザー名及びパスワードを登録しました");
		}).catch(() => {
			console.log(red + "[登録エラー] ユーザー名及びパスワードの登録に失敗しました。もう一度再起動してください" + reset);
			process.exit();
		});
		await sleep(500);

		/* 履修データの登録 */
		console.log("続いて、履修科目データの登録を行います・・・");
		/* makeSchedule関数：data/schedule.jsonの作成 */

		await makeSchedule(data_can_write).catch(() => {
			console.log(red + "[登録エラー] 履修科目データの登録に失敗しました。パスワードなどが正しいか確認してもう一度やり直してください" + reset);
			process.exit();
		});
		console.log("\n設定が完了しました。次回起動時から使用可能です");
		console.log("終了します");
		process.exit();
	} catch (e) {
		//info.jsonがすでに暗号化されていてjsonとして取り込めなかったとき
		const data_read_only = fs.readFileSync('resource/data/info.json', "utf-8"); //info.jsonの取り込み
		return JSON.parse(await crypt.decrypt(data_read_only, await crypt.strToDec(cpname)));//info.jsonの中身を復号して変換
	}
};


/* 
	openSUS関数
	main関数で入力されたコマンドに対応するサイトを開き、自動操縦を行う。
	EUCが選択されたときはヘッドレス。
*/
async function openSUS(whichOpen, EUC, data) {
	let browser;
	try {
		/* ブラウザの立ち上げ */
		browser = await puppeteer.launch({
			headless: (whichOpen[0] === "euc") ? true : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
			slowMo: (whichOpen[0] === "euc") ? 0 : 2, //タイピング・クリックなどの各動作間の速度
			defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
			channel: "chrome",//chromeを探し出して開く
			ignoreDefaultArgs: [
				"--disable-extensions",
				"--enable-automation",
			],
			args: [
				// '--disable-gpu',//<-軽量化のためにコピってきたけどなんかの不具合になったから消した。
				'--disable-dev-shm-usage',
				'--disable-setuid-sandbox',
				'--no-first-run',
				'--no-zygote',
				// "--enable-automation=false",
				// '--single-process' //<-軽量化のためにコピってきたけどなんかの不具合になったから消した。
			]
		});
	} catch (e) {
		console.log("ブラウザが開きませんでした。chromeがインストールされていることを確認してください。");
	}

	const pages = await browser.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
	
	const promis_list = [];
	//[sclass,sola]だった場合どっちも起動
	whichOpen.forEach(async (site) => {
		/* sclassのとき */
		if (site === "sclass") {
			// await openSclass(browser,data);
			promis_list.push(openSclass(browser, data));
		}
		/* solaのとき */
		if (site === "sola") {
			// await openSola(browser,data);
			promis_list.push(openSola(browser, data));
		}
		/* eucのとき */
		if (site === "euc") {
			promis_list.push(openEuc(browser, data, EUC));
			// await openEuc(browser,data,EUC);
		}
	});
	await Promise.all(promis_list);
	await pages[0].close();//about:brankを削除
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
	const target_a_ID = "a#a-2"; //solaのリンクのID

	const pages = await browser.pages(); //ページリスト取得(Exitcポータルの削除のため)

	await page.waitForSelector(target_name_ID, { visible: true, timeout: 30000 });
	await page.type(target_name_ID, user_name);//username入力
	await page.click(target_submit_ID);//submitクリック
	await page.waitForSelector(target_pass_ID, { visible: true, timeout: 30000 });
	await page.type(target_pass_ID, password);//password入力
	await page.click(target_pass_ID, { delay: 800 });//passwordクリック(確実にsubmitするため)
	await page.click(target_submit_ID);//submitクリック
	await page.waitForSelector(target_a_ID, { visible: true, timeout: 30000 });
	await page.click(target_a_ID);//aクリック
	//ポータルサイトをページタイトルから判定して削除
	pages.forEach(async (p) => {
		if (await p.title() === "アカウント") {
			await p.close();
		}
	});	
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
		if (!fs.existsSync("logs/euc.log")) {
			fs.writeFileSync("logs/euc.log", todayEUC, "utf-8");
		} else {
			try {
				fs.appendFileSync("logs/euc.log", todayEUC, "utf-8");
			} catch (e) {
				console.log(red + "logs/euc.logにEUCを書き込めませんでした。" + reset);
			}
		}
	}
	console.log(cyan + nam + "\n" + reset + red + tex + reset);
	await browser.close();
}