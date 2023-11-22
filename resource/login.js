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
const readline = require('readline');//readlineのインポート
const fs = require('fs');//fsのインポート
const { crypt } = require('./crypt');
const os = require('os');
// const { crypt } = require('./crypt');
/* グローバル変数 */
const path = {	//デスクトップとノーパソのBraveのインストール先リスト
	desktop: "C:/Program Files (x86)/BraveSoftware/Brave-Browser/application/brave.exe",
	raptop: "resource/Chrome/chrome.exe"
};
let execute = "";//ブラウザをどのアプリで開くか。デフォルトはChromium

const today = {
	year: new Date().getFullYear(),
	month: new Date().getMonth(),
	date: new Date().getDate(),
	hour: new Date().getHours(),
	minute: new Date().getMinutes(),
	sec: new Date().getSeconds(),
	getToday: function getToday() {
		return `${this.year}-${this.month.toString().padStart(2, '0')}-${this.date.toString().padStart(2, '0')}-${this.hour.toString().padStart(2, '0')}-${this.minute.toString().padStart(2, '0')}-${this.sec.toString().padStart(2, '0')}`
	},
	getTodayJP: function getToday() {
		return `${this.year}年${this.month.toString().padStart(2, '0')}月${this.date.toString().padStart(2, '0')}日${this.hour.toString().padStart(2, '0')}時${this.minute.toString().padStart(2, '0')}分${this.sec.toString().padStart(2, '0')}秒`
	}
}

const black = '\u001b[30m';
const red = '\u001b[31m';
const green = '\u001b[32m';
const yellow = '\u001b[33m';
const blue = '\u001b[34m';
const magenta = '\u001b[35m';
const cyan = '\u001b[36m';
const white = '\u001b[37m';

const reset = '\u001b[0m';

// 環境によってbraveのインストール場所が違うことがあるのでその指定。どちらも見つからなければChromium
if (fs.existsSync(path.desktop)) {
	execute = path.desktop;
} else if (fs.existsSync(path.raptop)) {
	execute = path.raptop;
} else {
	execute = "";
}
// imagesフォルダがあるか判定。なければ作成
if (!fs.existsSync("images")) {
	fs.mkdirSync("images");
}
// logsフォルダがあるか判定。なければ作成
if (!fs.existsSync("logs")) {
	fs.mkdirSync("logs");
}


// 標準入力の受け取り
const input = prompt => {
	const readInterface = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise(resolive => readInterface.question(prompt,
		input => {
			readInterface.close();
			resolive(input); //入力内容はinput()関数の返り値としてPromise型で返される。awaitをつけることで文字列になる。
		}));
};

//初回起動設定
async function input_name_and_pass() {
	const cpname = os.hostname();
	try {
		let data_can_write = JSON.parse(fs.readFileSync('resource/info.json', "utf-8")); //info.jsonの取り込み
		console.log("初回起動を確認。ユーザー名(学籍番号)とパスワードの設定を行います。");
		const NAME = await input("UserName?>");
		const PAWO = await input("PassWord?>");
		data_can_write.username = NAME; //usernameの追加
		data_can_write.password = PAWO; //passwordの追加
		fs.writeFileSync("resource/info.json", await crypt.encrypt(JSON.stringify(data_can_write), await crypt.strToDec(cpname)));//info.jsonを暗号化
		console.log("設定が完了しました。次回起動時から使用可能です");
		console.log("終了します");
		process.exit();
	} catch (e) {
		const data_read_only = fs.readFileSync('resource/info.json', "utf-8"); //info.jsonの取り込み
		// process.exit();	
		return JSON.parse(await crypt.decrypt(data_read_only, await crypt.strToDec(cpname)));//info.jsonの中身を復号して変換
	}
};
/* 
	main関数 
	ここでは開きたいサイトのコマンドを標準入力で受け取ったり、
	openSUS関数の実行をしたりしてます。
*/
async function main() {
	/* 
		標準入力によって、[sclass],[sola],[euc],[both(sclass&sola)]の判定を行い、
		eucならさらに番号の入力を求める。
		間違いなどがなければopenSUSを実行する。
	*/

	let EUC = 0;//EUC番号を格納する変数

	const data = await input_name_and_pass();

	let whichOpen = [await input("\"sclass\"or\"sola\"or\"both\"or\"euc\"\nどれを開く？>")];//inputの返り値を常に配列として格納
	if (whichOpen[0] === "both") {	//bothが入力されたなら、sclassとsolaを両方whichOpenに格納
		whichOpen = ["sclass", "sola"];
	} else if (whichOpen[0] === "euc") { //eucが入力されたならeuc番号を聞く
		EUC = await input("euc?>");
	} else if (whichOpen != "sclass" && whichOpen != "sola" && whichOpen != "both" && whichOpen != "euc") {
		console.log(red + "入力が間違っています。" + reset); //入力が[sclass],[sola],[euc],[both(sclass&sola)]のどれでもなければエラーとして終了。
		return 1;
	}
	await openSUS(whichOpen, EUC, data);//openSUSを実行
}

/* 
	openSUS関数
	main関数で入力されたコマンドに対応するサイトを開き、自動操縦を行う。
	EUCが選択されたときはヘッドレス。
*/
async function openSUS(whichOpen, EUC, data) {
	const user_name = data.username;
	const password = data.password;
	/* ブラウザの立ち上げ */
	const browser = await puppeteer.launch({
		headless: false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
		slowMo: 0.1, //タイピング・クリックなどの各動作間の速度
		defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
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
		],
		executablePath: execute //どのブラウザで開くかを設定
	});

	const pages = await browser.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)

	//[sclass,sola]だった場合どっちも起動
	whichOpen.forEach(async (site) => {

		/* sclassのとき */
		if (site === "sclass") {
			const info = data.sclass;//dataからsclassの情報を取得

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
		/* solaのとき */
		if (site === "sola") {
			const info = data.sola; //dataからsolaの情報を取得

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
			// // 新しいページが開かれたときのイベントを待機する
			// const [newPage] = await Promise.all([
			// 	browser.waitForTarget(target => target.opener() === page.target()).then(target => target.page())
			// ]);

			// 新しいページの内容を取得する
			//ここからSOLAが開かれたあとの処理
			// await newPage.waitForSelector("li.depth_3");
			// const lis = await page.$$eval("li.depth_3 > li",()=>{
			// 	return 
			// });
			// await newPage.click(li);
			// // await browser.close();
		}
		/* eucのとき */
		if (site === "euc") {
			//ヘッドレスのためにブラウザを更新
			const browser = await puppeteer.launch({
				// headless: false,
				slowMo: 0,
				defaultViewport: null,
				ignoreDefaultArgs: [
					"disable - infobars",
					"disable-extensions",
					"--enable-automation=true"
				],
				args: [
					// '--disable-gpu',
					'--disable-dev-shm-usage',
					'--disable-setuid-sandbox',
					'--no-first-run',
					'--no-zygote',
					// '--single-process'
				],
				executablePath: execute
			});

			const info = data.sclass; //sclassのデータを取得

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
	});
	await pages[0].close();//about:brankを削除
}
main();