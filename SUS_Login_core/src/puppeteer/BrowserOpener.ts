import * as puppeteer from "puppeteer-core";
import {launch} from "puppeteer-core";
import {readJSON} from "../utils/myUtils";
import {control as cl} from "../utils/control";
import WaitAccessMessage from "./WaitAccessMessage";


export namespace browserOpener{
    export type Param = {
        userdata:User,
        mode:("SCLASS"|"SOLA"|"EUC"),
        EUC?:string,
        subject_URL?:string,
        func?:Function
    }
    type User={
        ID:string,
        password:string
    }
    type Contexts = [puppeteer.Browser, puppeteer.Page];
    type Selectors = {
        "SCLASS":{
            [selector_name:string]:string;
        },
        "SOLA":{
            [selector_name:string]:string;
        },
        "EUC":{
            [selector_name:string]:string;
        },
    }

    export class BrowserOpener {
        private readonly mode:("SCLASS"|"SOLA"|"EUC");
        private readonly userdata:User;
        private readonly default_URL:string;
        private readonly is_headless:boolean; //EUCのときだけtrue
        private readonly EUC:string;
        private readonly selectors:Selectors;
        private browser:puppeteer.Browser|undefined;
        private page:puppeteer.Page|undefined;
        private print_func:Function; //文字を表示させる関数
        // コンストラクタ
        constructor(param:Param) {
            this.mode = param.mode;
            this.userdata = param.userdata;
            this.EUC = param.EUC??"";
            this.browser = undefined;
            this.page = undefined;
            this.selectors = importJSON();
            this.print_func = param.func??console.log;
            switch (this.mode) {
                case "SCLASS":
                    this.is_headless = false;
                    this.default_URL = "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp";
                    break;
                case "EUC":
                    this.is_headless = true;
                    this.default_URL = "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp";
                    break;
                case "SOLA":
                    this.is_headless = false;
                    this.default_URL = "https://sola.sus.ac.jp/";
                    break;
            }
        }
        public async open(){
            [this.browser,this.page] = await this.createContext();
            await this.errorLoop(4,async()=>{
                switch (this.mode) {
                    case "SCLASS":
                        await this.openSCLASS();
                        await this.resizeWindow([800,600]);
                        break;
                    case "EUC":
                        await this.openEUC();
                        await this.close();
                        break;
                    case "SOLA":
                        await this.openSOLA();
                        await this.resizeWindow([800,600]);
                        break;
                }
            });
        }
        public async close(){

        }
        private async errorLoop(max_loop:number,func:any){
            for (let i = 0; i < max_loop; i++) {
                try {
                    (await func)();
                    break;
                }catch (e) {
                    this.print_func(e);
                }
            }
        }
        // ブラウザコンテキストの生成
        private async createContext():Promise<Contexts>{
            const browser =  await launch({
                headless: (this.mode === "EUC") ? "new" : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
                slowMo: (this.mode === "EUC") ? 0 : 1, //タイピング・クリックなどの各動作間の速度
                defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
                channel: "chrome",//chromeを探し出して開く
                ignoreHTTPSErrors: true,
                waitForInitialPage:true,
                ignoreDefaultArgs: [
                    "--disable-extensions",
                    "--enable-automation",//コレ付けると「自動で動いています」みたいな表示が出ない
                ],
                args: [
                    `--app=https://www.google.co.jp/`,
                    "--incognito",
                    "--window-position=0,0",
                    (this.mode === "EUC") ? "--window-size=1200,1200" : "--window-size=200,300",
                    "--proxy-server='direct://'",
                    "--proxy-bypass-list=*",
                ]
            });
            const page = (await browser.pages())[0];
            return [browser,page];
        }
        // requestがあったらHTML,script以外のファイル読み込みを禁止し軽量化
        private async disableCSS(){
            if (this.page){
                // CSSをOFFにして高速化
                await this.page.setRequestInterception(true);
                this.page.on('request', (request) => {
                    if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });
            }else{
                throw "page is not opened";
            }
        }
        private async openSCLASS(){
            if (this.page){
                // cssをoffに
                if (this.is_headless){
                    await this.disableCSS();
                }
                this.print_func("[SCLASSにログインします]");
                //アクセス待機メッセージ生成器
                const wa = new WaitAccessMessage(1000,this.print_func);
                //アクセス待機メッセージ
                await wa.consoleOn("[SCLASS] アクセス中...");
                await this.page.goto(this.default_URL, {waitUntil: 'domcontentloaded', timeout: 0}); //ページ遷移
                await wa.consoleOff();
                //アクセスが完了したらアクセス完了の文字を出力
                this.print_func(`${cl.fg_green}[SCLASS] アクセス完了${cl.fg_reset}`);
                //アクセス待機メッセージ
                await wa.consoleOn("[SCLASS] ログイン中・・・");
                // SCLASSのセレクター
                const selectors = this.selectors.SCLASS;

                const logout_btn =  await this.page.waitForSelector(selectors.logout_btn,{timeout:30000});
                await logout_btn?.click();
                const ID_input = await this.page.waitForSelector(selectors.ID_input, {timeout: 30000});
                await ID_input?.type(this.userdata.ID);
                const pass_input = await this.page.waitForSelector(selectors.pass_input, {timeout: 30000});
                await pass_input?.type(this.userdata.password);
                const login_btn =  await this.page.waitForSelector(selectors.login_btn,{timeout:30000});
                await login_btn?.click();
                //  アクセス出来たかチェック
                if (this.page.url().match("https://s-class.admin.sus.ac.jp/up/faces/up/")){
                    this.print_func(`${cl.bg_green}[SCLASS] ログイン完了${cl.fg_reset}`);
                    return this.page;
                }else if(this.page.url().match("https://s-class.admin.sus.ac.jp/up/faces/login/")){
                    throw new Error("[Input Error]\n不正な領域にユーザー名あるいはパスワードが入力されたためsclass側でエラーが出ました。");//errorを返す
                }
            }else{
                throw "page is not opened";
            }
        }
        private async openSOLA(){

        }
        private async openEUC(){

        }
        private resizeWindow([w,h]:[number,number]) {
            return new Promise(async (resolve, reject) => {
                try {
                    const session = await this.page.target().createCDPSession();
                    const {windowId} = await session.send('Browser.getWindowForTarget');
                    await session.send('Browser.setWindowBounds', {
                        bounds: {
                            height: h,
                            width: w
                        },
                        windowId: windowId,
                    });
                    resolve(true);
                } catch (e) {
                    reject(e)
                }
            });
        }
    }
}
