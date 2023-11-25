import {control as cl} from "../utils/control.js";
import {today} from "../utils/today.js";
import {appendFileSync, existsSync, writeFileSync} from "fs";
import WaitAccessMessage from "./WaitAccessMessage.js";
import {launch} from "puppeteer";

class Openers {
        browser = undefined;
        pageList = [];
    constructor() {
    }
    static async build(){
        const temp = new Openers();

        /* ブラウザの立ち上げ */
        temp.browser = await launch({
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
    }
    async openSclass(browser, data) {
        const info = data.sclass;//dataからsclassの情報を取得
        const user_name = data.username;
        const password = data.password;
        //新規ページを開く
        const page = await browser.newPage();

        const url = info.url;//sclassのurl

        //アクセス待機メッセージ
        const waitAccess = new WaitAccessMessage(data);
        await waitAccess.on();//アクセス待機メッセージ開始
        try {
            await page.goto(url, {waitUntil: 'networkidle2', timeout: 0}).catch(async()=>{
                await waitAccess.off();
                return new Promise.reject();
            }); //ページ遷移

            //アクセスが完了したらドットを打つのをやめてアクセス完了の文字を出力
            process.stdout.write(`${cl.lineClear}${cl.initialLine()}${cl.fg_green}アクセス完了${cl.fg_reset}\n`);
            await waitAccess.off()

            const target_name_ID = info.target.name; //username入力要素のID
            const target_pass_ID = info.target.pass; //password入力要素のID
            const target_submit_ID = info.target.submit; //submitボタンのID
            await page.waitForSelector(target_submit_ID, {visible: true, timeout: 15000});
            await page.click(target_submit_ID); //submitクリック
            await page.waitForSelector(target_name_ID, {visible: true, timeout: 15000});
            await page.click(target_name_ID); //usernameクリック
            await page.type(target_name_ID, user_name); //username入力
            await page.waitForSelector(target_pass_ID, {visible: true, timeout: 15000});
            await page.click(target_pass_ID); //passwordクリック
            await page.type(target_pass_ID, password); //password入力
            await page.waitForSelector(target_submit_ID, {visible: true, timeout: 15000});
            await page.click(target_submit_ID); //submitクリック

            const isError = await page.waitForSelector("span#htmlErrorMessage", {visible: true, timeout: 2500})
                .then(()=>true)
                .catch(()=>false);
            //エラーメッセージが取れてしまったときは失敗を返す
            if (isError){
                throw new Error("Input Error : 不正な領域にユーザー名あるいはパスワードが入力されたためsclass側でエラーが出ました。");//rejectを返す
            }else{
                console.log(`\n${cl.bg_green}sclassログイン完了${cl.fg_reset}`);
                data.clg_count++;
            }
        }catch (e) {
            await waitAccess.off();
            throw new Error(`${cl.bg_red}[ERROR]${cl.bg_reset}\n+${e}`);
        }
        return page;
    }
    async openSola(browser, data) {
        const info = data.sola; //dataからsolaの情報を取得
        const user_name = data.username;
        const password = data.password;

        const page = await browser.newPage();//新規ページを作成

        const url = info.url;//solaのURL
        //アクセス待機メッセージ
        const waitAccess = new WaitAccessMessage(data);
        await waitAccess.on();//アクセス待機メッセージ開始
        try {
            await page.goto(url, {waitUntil: 'networkidle2', timeout: 0}); //ページ遷移

            //アクセスが完了したらドットを打つのをやめてアクセス完了の文字を出力
            await waitAccess.off();//待機メッセージ終了
            process.stdout.write(`${cl.lineClear}${cl.fg_green}${cl.initialLine()}アクセス完了${cl.fg_reset}\n`);

            const target_name_ID = info.target.name; //username入力要素のID
            const target_pass_ID = info.target.pass; //password入力要素のID
            const target_submit_ID = info.target.submit; //submitボタンのID
            await page.waitForSelector(target_name_ID, {visible: true, timeout: 30000});
            await page.type(target_name_ID, user_name);//username入力
            await page.click(target_submit_ID);//submitクリック
            await page.waitForSelector(target_pass_ID, {visible: true, timeout: 30000});
            await page.type(target_pass_ID, password);//password入力
            await page.click(target_pass_ID);//passwordクリック(確実にsubmitするため)
            await page.click(target_submit_ID, {delay: 800});//submitクリック
            await page.waitForNavigation({waitUntil: "load", timeout: 2000}).catch(async () => {
                await page.click(target_submit_ID, {delay: 800});//submitクリック
            });
            console.log(`\n${cl.bg_green}SOLAログイン完了${cl.fg_reset}`);
            data.clg_count++;
        }catch (e){
            await waitAccess.off();
            throw new Error(`${cl.bg_red}[ERROR]${cl.bg_reset}\n+${e}`);
        }
        return page;

    }
    async openEuc(browser, data, EUC) {

    const info = data.sclass; //sclassのデータを取得
    const user_name = data.username;
    const password = data.password;
    data.clg_count = 0; //標準出力の回数
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
    //アクセス待機メッセージ
    const waitAccess = new WaitAccessMessage(data);
    await waitAccess.on();//アクセス待機メッセージ開始

    try {
        await page.goto(url, {waitUntil: 'networkidle0', timeout: 20000}); //sclassに遷移

        //アクセスが完了したらドットを打つのをやめてアクセス完了の文字を出力
        await waitAccess.off();//アクセス待機メッセージ終了
        process.stdout.write(`${cl.lineClear}${cl.fg_green}${cl.initialLine()}アクセス完了${cl.fg_reset}\n`);

        const target_name_ID = info.target.name;//username入力要素のID
        const target_pass_ID = info.target.pass;//password入力要素のID
        const target_submit_ID = info.target.submit;//submitボタンのID
        await page.waitForSelector(target_submit_ID, {timeout: 20000});
        await page.click(target_submit_ID);//submitクリック
        await page.waitForSelector(target_name_ID, {timeout: 20000});
        await page.type(target_name_ID, user_name);//username入力
        await page.waitForSelector(target_pass_ID, {timeout: 20000});
        await page.type(target_pass_ID, password);//password入力
        await page.waitForSelector(target_submit_ID, {timeout: 20000});
        await page.click(target_submit_ID)//submitクリック
        console.log(`${cl.bg_green}sclassログイン完了${cl.fg_reset}`);

        data.clg_count++;
        await page.evaluate(() => {window.scroll(0, 0);});

        const target_risyuu_ID = "div#pmenu4"; //sclassの上のバーの「履修関連」
        await page.waitForSelector(target_risyuu_ID, {visible: true, timeout: 30000});
        await page.hover(target_risyuu_ID);//「履修関連」をホバー
        const target_EUC_ID = await page.$eval(target_risyuu_ID,(div)=>{
            return `#${Array.from(div.children).filter((c) => c.text === "EUC学生出欠登録")[0].id}`
        });
        await page.waitForSelector(target_EUC_ID, {visible: true, timeout: 30000});
        await page.click(target_EUC_ID);//EUCをクリック
        const target_eucIn_ID = "input.inputText"; //EUC入力要素のID
        const target_eucSubmit_ID = "input.button";//EUCsubmitボタンのID
        await page.waitForSelector(target_eucIn_ID, {visible: true, timeout: 0});
        await page.type(target_eucIn_ID, EUC);//EUCの入力

        page.on("dialog", async dialog => {
            await dialog.accept(); // OK
        });

        await page.click(target_eucSubmit_ID);//submitをクリック
        await page.waitForSelector("td span.outputText", {timeout: 10000});

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
        data.miss_count = 0;
        await browser.close();
    }catch (e){
        await waitAccess.off();
        throw new Error(`${cl.bg_red}[ERROR]${cl.bg_reset}\n+${e}`);
    }
}
}