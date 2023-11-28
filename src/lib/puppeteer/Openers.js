import {control as cl} from "../utils/control.js";
import {today} from "../utils/today.js";
import {appendFileSync, existsSync, writeFileSync} from "fs";
import {Browser} from "puppeteer";

/**
 * @param {Browser} browser
 * @param {{name:string,password:string}} user
 * @param {boolean} headless
 * */
export async function openSclass(browser, user,headless=false) {
    const user_name = user.name;
    const password  = user.password;
    const url = "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp"; //sclassのurl

    const target_submit_ID = "input[type=image]";//submitボタンのID
    const target_name_ID = ".inputText";//username入力要素のID
    const target_pass_ID = ".inputSecret";//password入力要素のID

    return new Promise(async(resolve,reject)=>{
        //新規ページを開く
        const page = await browser.newPage();
        if (headless){
            // CSSをOFFにして高速化
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        }
        //アクセス待機メッセージ
        await page.goto(url, {waitUntil: 'networkidle2', timeout: 0}).catch(()=>{
            reject("ページ遷移エラー")
        }); //ページ遷移

        //アクセスが完了したらドットを打つのをやめてアクセス完了の文字を出力
        process.stdout.write(`${cl.lineClear}${cl.initialLine()}${cl.fg_green}アクセス完了${cl.fg_reset}\n`);

        try {
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
        }catch (e) {
            reject(e);
        }
        const isError = await page.waitForSelector("span#htmlErrorMessage", {visible: true, timeout: 2500})
            .then(()=>true)
            .catch(()=>false);
        //エラーメッセージが取れてしまったときは失敗を返す
        if (isError){
            reject("Input Error : 不正な領域にユーザー名あるいはパスワードが入力されたためsclass側でエラーが出ました。");//rejectを返す
        }
        console.log(`\n${cl.bg_green}sclassログイン完了${cl.fg_reset}`);
        resolve(page);
    });
}
/**
 * @param {Browser} browser
 * @param {{name:string,password:string}} user
 * */
export async function openSola(browser, user) {
    const user_name = user.name;
    const password  = user.password;
    const url = "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp"; //sclassのurl

    const target_name_ID = "#identifier"; //username入力要素のID
    const target_pass_ID = "#password"; //password入力要素のID
    const target_submit_ID = "button[type=submit]"; //submitボタンのID


    return new Promise(async(resolve, reject)=>{
        const page = await browser.newPage();//新規ページを作成
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 0 });//ページ遷移
        process.stdout.write(`${cl.lineClear}${cl.fg_green}${cl.initialLine()}アクセス完了${cl.fg_reset}\n`);

        try {
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
            resolve(page);
        }catch (e){
            reject(e);
        }
    });
}
/**
 * @param {Browser} browser
 * @param {{name:string,password:string}} user
 * @param {number} EUC
 * */
export async function openEuc(browser, user, EUC) {

   return new Promise(async(resolve, reject)=>{
       //SCLSSにヘッドレスでアクセス
       const page = await openSclass(browser,user,true);
       //スクロールを一番上に
       await page.evaluate(() => {window.scroll(0, 0);});

       try {
           const target_risyuu_ID = "div#pmenu4"; //sclassの上のバーの「履修関連」
           await page.waitForSelector(target_risyuu_ID, {visible: true, timeout: 30000});
           await page.hover(target_risyuu_ID);//「履修関連」をホバー
           const target_EUC_ID = await page.$eval(target_risyuu_ID,(div)=>{
               return `#${Array.from(div.children).filter((c) => c.text === "EUC学生出欠登録")[0].id}`
           });
           await page.waitForSelector(target_EUC_ID, {visible: true, timeout: 30000});
           await page.click(target_EUC_ID);//「EUC学生出欠登録」をクリック
           const target_eucIn_ID = "input.inputText"; //EUCinput要素のID
           const target_eucSubmit_ID = "input.button";//EUCsubmit要素のID
           await page.waitForSelector(target_eucIn_ID, {visible: true, timeout: 0});
           await page.type(target_eucIn_ID, EUC);//EUCの入力

           //ダイアログを押す
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
                   quality: 100
               });
               // /logs/euc.logファイルがあるか判定。なければ作成あったら追記
               const todayEUC = `授業名：${nam},日付：${today.getTodayJP()},EUC番号：${EUC},結果：${tex}\n`;
               if (!existsSync("logs/euc.log")) {
                   writeFileSync("logs/euc.log", todayEUC, "utf-8");
               } else {
                   appendFileSync("logs/euc.log", todayEUC, "utf-8");
               }
           }
            await browser.close();
            resolve()
       }catch (e){
            await browser.close();
            reject(e);
       }
   });
}