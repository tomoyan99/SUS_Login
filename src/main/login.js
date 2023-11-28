"use strict";
/*
	[SUS_login]
	諏訪理科のsola,sclassに自動ログインしたり、eucを自動で入力してくれるスクリプト。
*/

/*
	使用モジュール
		puppeteer:自動入力やクリックを担う
		fs       :jsonファイルの取り込み
		input    :標準入力全般。パスワードの入力にも用いる
		choice   :選択肢の表示とキー選択
		today    :日付関連モジュール
		control  :コンソールの色等の制御
		pause    :ポーズコマンドの再現
    child_process:windowsコマンドの実行
    checkInternet:ネットワーク接続の確認
        timers   :インターバルの削除
    SelectOptions:選択肢選択用のクラス
    importJSON   :JSONをimportしやすいモジュール

*/
import {launch} from 'puppeteer'; //pupeteerのインポート
import {writeFileSync} from 'fs'; //fsのインポート
import {choice} from "../lib/utils/choise.js"; //十字キー選択
import {today} from '../lib/utils/today.js'; //日付関連
import {control as cl} from "../lib/utils/control.js"; //コンソール制御関連
import {pause} from '../lib/utils/pause.js'; //PAUSEコマンドの再現
import {execSync} from "child_process"; //コンソールコマンドの実行
import {isNetConnected} from "../lib/utils/checkInternet.js"
import {clearInterval} from "timers";
import {makeSchedule} from "../lib/utils/makeSchedule.js";
import MainHome from "../lib/MainHome.js";

/*
	login関数
	ここでは開きたいサイトのコマンドを標準入力で受け取ったり、
	openSUS関数の実行をしたりしてます。
*/
export async function login(version = "",data) {
    const MB = new MainHome([data.main,data.solaLink]);
}

/*
	openSUS関数
	main関数で入力されたコマンドに対応するサイトを開き、自動操縦を行う。
	EUCが選択されたときはヘッドレス。
*/
async function openSUS(whichOpen, EUC, data) {

    //コマンドがeuc,sola,sclassでなければ抜ける
    if (whichOpen[0] !=="euc" && whichOpen[0] !== "sclass" && whichOpen[0] !== "sola" ){
        return 0;
    }
    /* ブラウザの立ち上げ */
    const browser = await launch({
        headless: (whichOpen[0] === "euc") ? "new" : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
        slowMo: (whichOpen[0] === "euc") ? 0 : 0, //タイピング・クリックなどの各動作間の速度
        defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
        channel: "chrome",//chromeを探し出して開く
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: [
            "--disable-extensions",
            "--enable-automation",
        ],
        args: [
            "--proxy-server='direct://'",
            "--proxy-bypass-list=*"
        ]
    }).catch(() => {
        throw new Error(cl.fg_red + "ブラウザが開きませんでした。chromeがインストールされていることを確認してください。" + cl.bg_reset);
    });

    const context = await browser.createIncognitoBrowserContext();//シークレットモードで開くため
    const pagesB = await browser.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
    if (whichOpen[0] !== "euc") {
        await pagesB[0].close();//about:brankを削除
    }
    //[sclass,sola]だった場合どっちも起動
    for (const site of whichOpen) {
        data.miss_count = 0; //ミスカウントの初期化
        data.clg_count = 0;
        /* sclassのとき */
        if (site === "sclass") {
            await context.newPage();
            let pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
            Errorloop:
                while (true) {
                    try {
                        await openSclass(context, data);
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        await pagesC[Math.max(pagesC.length - 2, 0)].close();
                        break;
                    } catch (error) {
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        if (pagesC.length - 1 > 0){
                            await pagesC[pagesC.length - 1].close();
                            for (let i = 0; i < data.clg_count; i++) {
                                process.stdout.write(`${cl.up}${cl.lineClear}`);
                            }
                            console.log(`${cl.bg_yellow}${cl.fg_black}接続エラー(${data.miss_count + 1})：接続に失敗しました再試行します。${cl.fg_reset}`);
                            if (data.miss_count === 3) {
                                console.log(`\n${cl.bg_red}アクセスエラー：sclassへのアクセスに失敗しました。ネットワークが混雑している可能性があるので、しばらく時間をおいて再度試してください。${cl.bg_reset}\n`);
                                pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                                await pagesC[Math.max(pagesC.length - 2, 0)].close();
                                break;
                            }
                            data.miss_count++;
                            await sleep(1000);
                        }else{
                            break;
                        }
                    }
                }
        }//if sclass
        /* solaのとき */
        if (site === "sola") {
            await context.newPage();
            let pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
            Errorloop:
                while (true) {
                    try {
                        await openSola(context, data);
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        await pagesC[Math.max(pagesC.length - 2, 0)].close();
                        break;
                    } catch (error) {
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        if (pagesC.length - 1 > 0){
                            await pagesC[pagesC.length - 1].close();
                            for (let i = 0; i < data.clg_count; i++) {
                                process.stdout.write(`${cl.up}${cl.lineClear}`);
                            }
                            console.log(`${cl.bg_yellow}${cl.fg_black}接続エラー(${data.miss_count + 1})：接続に失敗しました再試行します。${cl.fg_reset}`);
                            if (data.miss_count === 3) {
                                console.log(`\n${cl.bg_red}アクセスエラー：solaへのアクセスに失敗しました。ネットワークが混雑している可能性があるので、しばらく時間をおいて再度試してください。${cl.bg_reset}`);
                                pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                                await pagesC[Math.max(pagesC.length - 2, 0)].close();
                                break;
                            }
                            data.miss_count++;
                            await sleep(1000);
                        }else{
                            break;
                        }
                    }
                }

        }// if sola
        /* eucのとき */
        if (site === "euc") {
            Errorloop:
                while (true) {
                    try {
                        await openEuc(context, data, EUC);
                        break;
                    } catch (error) {
                        // console.log(error);
                        for (let i = 0; i < data.clg_count; i++) {
                            process.stdout.write(`${cl.up}${cl.lineClear}`);
                        }
                        console.log(`${cl.bg_yellow}${cl.fg_black}接続エラー(${data.miss_count + 1})：接続に失敗しました再試行します。${cl.fg_reset}`);
                        if (data.miss_count === 3) {
                            await browser.close();
                            console.log(`\n${cl.bg_red}登録エラー：EUCの登録に失敗しました。ネットワークが混雑している可能性があるので、しばらく時間をおいて再度試してください。${cl.bg_reset}`);
                            break;
                        }
                        data.miss_count++;
                        await sleep(300);
                    }
                }
            await browser.close();
        }//if EUC
    }// for of
}
