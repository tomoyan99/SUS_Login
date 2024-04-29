import {control as cl} from "../utils/control.js";
import {today} from "../utils/today.js";
import {appendFileSync} from "fs";
import {Browser, BrowserContext, launch} from "puppeteer-core";
import WaitAccessMessage from "./WaitAccessMessage.ts";
import {sleep} from "../utils/myUtils.js";

/**
 * @param {('EUC'|'SCLASS'|'SOLA')} mode
 * */
export async function openContext(mode) {
    let browser = undefined;
    try {
        /* ブラウザの立ち上げ */
        browser = await launch({
            headless: (mode === "EUC") ? "new" : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
            slowMo: (mode === "EUC") ? 0 : 1, //タイピング・クリックなどの各動作間の速度
            defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
            channel: "chrome",//chromeを探し出して開く
            ignoreHTTPSErrors: true,
            waitForInitialPage: true,
            ignoreDefaultArgs: [
                "--disable-extensions",
                "--enable-automation",
            ],
            args: [
                `--app=https://www.google.co.jp/`,
                "--incognito",
                "--window-position=0,0",
                (mode === "EUC") ? "--window-size=1200,1200" : "--window-size=200,300",
                "--proxy-server='direct://'",
                "--proxy-bypass-list=*",
                "--test-type"
            ]
        }).catch(() => {
            throw "ブラウザが開けませんでした。chromeがインストールされていることを確認してください";
        });
        return browser;
    } catch (e) {
        if (browser) {
            await browser?.close();
        }
        throw e;
    }
}

/**
 * @param {Browser|BrowserContext} browser
 * @param {{username:string,password:string}} user
 * @param {boolean} headless
 * @param {function} func
 * */
export async function openSclass(browser, user, headless = false, func = console.log) {
    const user_name = user.username;
    const password = user.password;
    const url = "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp"; //sclassのurl

    const target_submit_ID = "input[type=image]";//submitボタンのID
    const target_name_ID = ".inputText";//username入力要素のID
    const target_pass_ID = ".inputSecret";//password入力要素のID
    //アクセス待機メッセージ
    const wa = new WaitAccessMessage(1000, func);
    func("[SCLASSにログインします]");
    try {
        const page = (await browser.pages())[0];
        if (headless) {
            // CSSをOFFにして高速化
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        }
        //アクセス待機メッセージ
        await wa.consoleOn("[SCLASS] アクセス中...");
        await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 0}); //ページ遷移
        await wa.consoleOff();
        //アクセスが完了したらアクセス完了の文字を出力
        func(`${cl.fg_green}[SCLASS] アクセス完了${cl.fg_reset}`);
        //アクセス待機メッセージ
        await wa.consoleOn("[SCLASS] ログイン中・・・");
        await page.evaluate(() => {
            window.scrollBy(50, 100)
        })
        await page.waitForSelector(target_submit_ID, {timeout: 30000});
        await page.click(target_submit_ID); //submitクリック
        await page.waitForSelector(target_name_ID, {timeout: 30000});
        await page.focus(target_name_ID); //usernameクリック
        await page.type(target_name_ID, user_name); //username入力
        await page.waitForSelector(target_pass_ID, {timeout: 30000});
        await page.focus(target_pass_ID); //passwordクリック
        await page.type(target_pass_ID, password); //password入力
        await page.waitForSelector(target_submit_ID, {timeout: 30000});
        await page.click(target_submit_ID); //submitクリック
        if (page.url().match("https://s-class.admin.sus.ac.jp/up/faces/up/")) {
            func(`${cl.bg_green}[SCLASS] ログイン完了${cl.fg_reset}`);
            return page;
        } else if (page.url().match("https://s-class.admin.sus.ac.jp/up/faces/login/")) {
            throw new Error("[Input Error]\n不正な領域にユーザー名あるいはパスワードが入力されたためsclass側でエラーが出ました。");//errorを返す
        }
    } catch (e) {
        throw e;
    } finally {
        await wa.consoleOff();
    }
}

/**
 * @param {Browser|BrowserContext} browser
 * @param {{username:string,password:string}} user
 * @param {boolean} headless
 * @param {string} URL
 * @param {function} func
 * */
export async function openSola(browser, user, headless = false, URL = "https://sola.sus.ac.jp/", func = console.log) {
    const user_name = user.username;
    const password = user.password;
    const url = URL; //solaまたはsola_pageのurl

    const target_name_ID = "#identifier"; //username入力要素のID
    const target_pass_ID = "#password"; //password入力要素のID
    const target_submit_ID = "#login-form-selector-tab-content button[type=submit]"; //submitボタンのID
    func("[SOLAにログインします]");
    //アクセス待機メッセージ
    const wa = new WaitAccessMessage(1000, func);
    try {
        const page = (await browser.pages())[0];
        if (headless) {
            // CSSをOFFにして高速化
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        }
        await wa.consoleOn("[SOLA] アクセス中...");
        await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 0}).catch(async () => {
            throw new Error("[SOLA] ページ遷移エラー");
        });//ページ遷移
        await wa.consoleOff();

        func(`${cl.fg_green}[SOLA] アクセス完了${cl.fg_reset}`);
        await wa.consoleOn("[SOLA] ログイン中・・・");
        await page.waitForSelector(target_name_ID, {timeout: 30000});
        await page.type(target_name_ID, user_name);//username入力
        await page.click(target_submit_ID);//submitクリック
        await page.waitForSelector(target_pass_ID, {timeout: 30000});
        await page.waitForSelector(target_submit_ID, {timeout: 30000});
        await page.type(target_pass_ID, password);//password入力
        await page.click(target_pass_ID);
        // clickが作動しないときの処理
        while (true) {
            console.log(!!page.url().match("https://sola.sus.ac.jp/"))
            const page_url = page.url();
            if (page.isClosed()) {
                console.log("close")
                throw "is closed";
            }
            if (page_url === "https://sus.ex-tic.com/auth/session") {
                try {
                    await page.waitForSelector(target_submit_ID, {timeout: 500});
                    await page.click(target_submit_ID, {delay: 300});
                } catch (e) {

                }
            } else if (page_url.match("https://sola.sus.ac.jp/")) {
                break;
            }
            await sleep(10);
        }
        func(`${cl.bg_green}[SOLA] ログイン完了${cl.fg_reset}`);
        return page;
    } catch (e) {
        throw e;
    } finally {
        await wa.consoleOff();
    }
}

/**
 * @param {Browser|BrowserContext} browser
 * @param {{username:string,password:string}} user
 * @param {number} EUC
 * @param {function} func
 * */
export async function openEuc(browser, user, EUC, func = console.log) {
    func("[EUC登録を行います]");
    //アクセス待機メッセージ
    const wa = new WaitAccessMessage(1000, func);
    try {
        //SCLSSにヘッドレスでアクセス
        const page = await openSclass(browser, user, true, func);
        await wa.consoleOn("[EUC] 登録中...")
        //スクロールを一番上に
        await page.evaluate(() => {
            window.scroll(0, 0);
        });
        const target_risyuu_ID = "div#pmenu4"; //sclassの上のバーの「履修関連」
        await page.waitForSelector(target_risyuu_ID, {visible: true, timeout: 30000});
        await page.hover(target_risyuu_ID);//「履修関連」をホバー
        //「履修登録」のタブが増えてたりしたときのため
        const target_EUC_ID = await page.$eval(target_risyuu_ID, (div) => {
            return `#${Array.from(div.children).filter((c) => c.text === "EUC学生出欠登録")[0].id}`
        });
        await page.waitForSelector(target_EUC_ID, {visible: true, timeout: 30000});
        await page.click(target_EUC_ID);//「EUC学生出欠登録」をクリック
        const target_eucIn_ID = "input.inputText"; //EUCinput要素のID
        const target_eucSubmit_ID = "input.button";//EUCsubmit要素のID
        await page.waitForSelector(target_eucIn_ID, {visible: true, timeout: 0});
        await page.type(target_eucIn_ID, EUC.toString());//EUCの入力

        //ダイアログを押す
        page.on("dialog", async dialog => {
            await dialog.accept(); // OK
        });

        await page.click(target_eucSubmit_ID);//submitをクリック
        await page.waitForSelector("td span.outputText", {timeout: 30000});
        //EUC登録した授業名を取得
        const num = await page.$eval("td span#form1\\3A Title", (tar) => {
            return tar.textContent.replace(/[\t\n]/g, "");
        }).catch(() => {
            return "";
        });
        //EUC登録の結果の文章を取得
        const tex = await page.$eval("td span#form1\\3A htmlTorokukekka", (tar) => {
            return tar.textContent;
        });
        await wa.consoleOff();
        func(`${cl.fg_cyan}${num}\n${cl.fg_reset}${cl.fg_red}${tex}${cl.fg_reset}`); //結果をコンソールに表示
        //「文章が異なります。」が出なかったらスクショ
        if (tex !== "番号が異なります。") {
            const shot_target = await page.$("table.sennasi");
            const filename = today.getToday();
            await shot_target.screenshot({
                path: "data/images/" + num + "_" + filename + ".jpg",
                type: 'jpeg',
                quality: 100
            });
            // /logs/euc.logファイルがあるか判定。なければ作成あったら追記
            const todayEUC = `日付:${today.getTodayJP()},授業名：${num},EUC番号:${EUC},結果:${tex}\n`;
            appendFileSync("data/logs/euc.log", todayEUC, "utf-8");
        }
        return;
    } catch (e) {
        throw e;
    } finally {
        await wa.consoleOff();
        await browser.close();
    }
}

/**
 * @param {Page} page
 * @param {[number,number]} wh
 * */
export function resizeWindow(page, [w, h]) {
    return new Promise(async (resolve, reject) => {
        try {
            const session = await page.target().createCDPSession();
            const {windowId} = await session.send('Browser.getWindowForTarget');
            await session.send('Browser.setWindowBounds', {
                bounds: {
                    height: h,
                    width: w
                },
                windowId: windowId,
            });
            resolve();
        } catch (e) {
            reject(e)
        }
    })
}