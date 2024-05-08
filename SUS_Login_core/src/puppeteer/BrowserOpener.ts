import * as puppeteer from "puppeteer-core";
import {control as cl} from "../utils/control";
import WaitAccessMessage from "./WaitAccessMessage";
import * as selectors from "./selectors.json";
import {User} from "../main/setup";
import {today} from "../utils/today";
import {appendFileSync, existsSync, mkdirSync} from "fs";
import {errorLoop, sleep} from "../utils/myUtils";

namespace Opener {
  export type LaunchOption = {
    printFunc?: Function;
    clearFunc?: Function;
    is_app?: boolean;
    is_headless?: boolean;
    is_secret?: boolean;
  }
  export type SiteMode = "SCLASS" | "SOLA" | "EUC";
  export type ModeOption<T extends SiteMode>=
       T extends "SCLASS" ?{ mode: "SCLASS"; }
      :T extends "SOLA"   ?{ mode: "SOLA"  ; solaLink_URL?: string; }
      :T extends "EUC"    ?{ mode: "EUC"   ; EUC: string; }
      :never;
  export type Contexts = [puppeteer.Browser, puppeteer.Page];
  export type Selectors = {
    SCLASS:Record<string, string>;
    SOLA  : Record<string, string>;
    EUC   : Record<string, string>;
    SCHEDULE: {
      SCLASS: Record<string, string>;
      SOLA  : Record<string, string>;
    };
  };

  export class BrowserOpener {
    protected mode: SiteMode | undefined;
    protected readonly userdata: User;
    protected target_URL: string;
    protected EUC: string | undefined;
    protected selectors: Selectors;
    protected solaLink_URL: string | undefined;
    protected browser: puppeteer.Browser | undefined;
    protected page: puppeteer.Page | undefined;
    public    printFunc: Function; //文字を表示させる関数
    public    clearFunc: Function; //文字を表示させる関数
    protected is_headless: boolean; //デフォルトはfalse
    protected is_app    : boolean; //ブラウザをappモードで開くかどうか(デフォルトはtrue)
    protected is_secret: boolean; //ブラウザをシークレットモードで開くかどうか(デフォルトはtrue)
    // コンストラクタ
    constructor(userdata: User) {
      this.userdata             = userdata;
      this.target_URL           = "";//必ず何らかの値で初期化されるから大丈夫
      this.browser              = undefined;
      this.page                 = undefined;
      this.selectors            = selectors;
      this.printFunc            = console.log;
      this.clearFunc            = console.clear;
      this.is_app               = true; //デフォルト：アプリモード
      this.is_headless          = false;//デフォルト：ノンヘッドレスモード
      this.is_secret            = true; //デフォルト：シークレットモード
      this.mode                 = undefined;
      this.solaLink_URL         = undefined;
    }
    // 疑似コンストラクタ
    // ブラウザを立ち上げる
    public async launch(option:LaunchOption) {
      this.printFunc = option.printFunc??console.log;
      this.clearFunc = option.clearFunc??console.clear;
      this.is_headless= option.is_headless??false;
      this.is_app     = option.is_app??true;
      this.is_secret  = option.is_secret??true; //デフォルト：シークレットモード
      // エラーだったら4回リトライ
      [this.browser, this.page] = await errorLoop<Contexts>(
          4,
          async () => await this.createContext()
      );
      return this;
    }
    public async open(option: ModeOption<SiteMode>): Promise<BrowserOpener> {
      return await errorLoop(
          4,
          async ()=>{
            // ブラウザが無いもしくは接続が無い場合はブラウザ閉じられエラーを出す
            if (!this.browser || (await this.browser.pages()).length === 0){
              throw new Error("BROWSER:CLOSED");
            }
            switch (option.mode) {
              case "SCLASS": {
                this.changeMode({
                  mode: option.mode,
                });
                await this.openSCLASS();
                await this.resizeWindow([800, 600]);
                return this;
              }
              case "SOLA": {
                this.changeMode({
                  mode: option.mode,
                  solaLink_URL: option.solaLink_URL,
                });
                await this.openSOLA();
                await this.resizeWindow([800, 600]);
                return this;
              }
              case "EUC": {
                this.changeMode({
                  mode: option.mode,
                  EUC: option.EUC,
                });
                await this.openEUC();
                await this.close();
                return this;
              }
            }
          });
    }
    public async close() {
      if (!this.browser) throw new Error("BROWSER:UNDEFINED");//ブラウザ未定義エラー
      await this.browser.close();
      this.browser = undefined;
    }
    public changeMode(option: ModeOption<SiteMode>): void {
      this.mode = option.mode;
      switch (option.mode) {
        case "SCLASS":
          this.target_URL =
              "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp";
          break;
        case "SOLA":
          this.target_URL = this.solaLink_URL
              ? this.solaLink_URL
              : "https://sola.sus.ac.jp/";
          break;
        case "EUC":
          // EUCだけはデフォルトでheadlessをtrueに
          this.EUC = option.EUC;
          this.target_URL =
              "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp";
          break;
      }
    }
    public getBrowser(){
      if (!this.browser) throw new Error("BROWSER:NOT_OPENED");
      return this.browser;
    }
    public getPage(){
      if (!this.page)throw new Error("PAGE:UNDEFINED");
      return this.page;
    }
    // ブラウザコンテキストの生成
    private async createContext(): Promise<Contexts> {
      try {
        const browser = await puppeteer.launch({
          headless: this.is_headless ? "new" : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
          slowMo: this.is_headless ? 0 : 1, //タイピング・クリックなどの各動作間の速度
          defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
          channel: "chrome", //chromeを探し出して開く
          ignoreHTTPSErrors: true,
          timeout:0,
          waitForInitialPage: true,
          ignoreDefaultArgs: [
            "--disable-extensions",
            "--enable-automation", //コレ付けると「自動で動いています」みたいな表示が出ない
          ],
          args: [
            ...(this.is_app ?["--app=https://www.google.co.jp/"]:[]), //appモードがonならappモードで開く
            ...(this.is_headless||!this.is_secret?[]:["--incognito"]),
            "--window-position=0,0",
            this.is_headless
                ? "--window-size=1200,1200"
                : "--window-size=200,300",
            "--proxy-server='direct://'",
            "--proxy-bypass-list=*",
            "--test-type"
          ],
        });
        const page = (await browser.pages())[0];
        return [browser, page];
      }catch (e) {
        throw new Error("BROWSER:CANNOT_OPEN");
      }
    }
    // requestがあったらHTML,script以外のファイル読み込みを禁止し軽量化
    public async disableCSS() {
      if (!this.page)throw new Error("PAGE:UNDEFINED");
      // CSSをOFFにして高速化
        await this.page.setRequestInterception(true);
        this.page.removeAllListeners("request");
        this.page.on("request", (request) => {
          if (["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1) {
            request.abort();
          } else {
            request.continue();
          }
        });
    }
    protected async openSCLASS(): Promise<void> {
      if (!this.page)throw new Error("PAGE:UNDEFINED");
      // cssをoffに
      if (this.is_headless) await this.disableCSS();
      this.printFunc("[SCLASSにログインします]");
      //アクセス待機メッセージ生成器
      const wa = new WaitAccessMessage(1000, this.printFunc);
      try {
        await wa.consoleOn("[SCLASS] アクセス中...");//アクセス待機メッセージON
        try {
          await this.page.goto(this.target_URL, {
            waitUntil: "domcontentloaded",
            timeout: 0,
          });
        }catch (e:any) {
          if (e?.message && e.message === `net::ERR_CONNECTION_REFUSED at ${this.target_URL}`){
            // 2時から5時はメンテタイム
            if (today.hour >=2 && today.hour <= 5)throw new Error("SCLASS:MAINTENANCE_TIME_ERROR");
            //それ以外は謎に繋がらないエラー
            throw new Error("SCLASS:CONNECTION_REFUSED");
          }else{
            throw new Error("SCLASS:UNKNOWN_GOTO_ERROR")
          }
        }
        await wa.consoleOff();//アクセス待機メッセージOFF
        this.printFunc(`${cl.fg_green}[SCLASS] アクセス完了${cl.fg_reset}`);
        await wa.consoleOn("[SCLASS] ログイン中・・・");//アクセス待機メッセージON
        const selectors = this.selectors.SCLASS; // SCLASSのセレクター
        const logout_btn = await this.page.waitForSelector(
            selectors.logout_btn,
            { timeout: 30000 },
        );// ログインボタン
        await logout_btn?.click();
        // 学籍番号入力
        const username_input = await this.page.waitForSelector(
            selectors.username_input,
            {timeout: 30000});
        await username_input?.click();//クリックして入力箇所の間違いを防ぐ
        await username_input?.type(this.userdata.username);
        // パスワード入力
        const password_input = await this.page.waitForSelector(
            selectors.password_input,
            { timeout: 30000});
        await password_input?.click();//クリックして入力箇所の間違いを防ぐ
        await password_input?.type(this.userdata.password);
        //提出・入力ボタン
        const login_btn = await this.page.waitForSelector(selectors.login_btn, {timeout: 30000,});
        await login_btn?.click();
        // waitForNavigatorが効かないのでbodyが現れるまで待つ
        // このとき、現れるまでの時間は不明なので無限に待つ
        await this.page.waitForSelector("body",{timeout:0});
        // URLを見て認証の成否をチェック
        if (this.page.url().match("https://s-class.admin.sus.ac.jp/up/faces/up/")) {
          this.printFunc(`${cl.bg_green}[SCLASS] ログイン完了${cl.fg_reset}`);
        } else if (this.page.url().match("https://s-class.admin.sus.ac.jp/up/faces/login/")) {
          throw new Error("SCLASS:AUTH_FAILURE");//認証失敗エラー
        }
      }catch (e:unknown) {
        let new_e :Error;
        new_e = (e instanceof Error)?e
                :(typeof e === "string")?new Error(e)
                :new Error("SCLASS:UNKNOWN_ERROR");
        throw new_e;
      }finally {
        await wa.consoleOff();// コンソールメッセージは必ずOFFに
      }
    }
    protected async openSOLA():Promise<void> {
      if (!this.page)throw new Error("PAGE:UNDEFINED");//ページ未定義エラー
      if (!this.target_URL)throw new Error("SOLA:URL_UNDEFINED");//ページ未定義エラー
      const selectors = this.selectors.SOLA;
      this.printFunc("[SOLAにログインします]");
      //アクセス待機メッセージ
      const wa = new WaitAccessMessage(1000,this.printFunc);
      try {
        if (this.is_headless)await this.disableCSS();
        await wa.consoleOn("[SOLA] アクセス中...");
        await this.page.goto(this.target_URL, { waitUntil: 'domcontentloaded', timeout: 0 });
        await wa.consoleOff();
        this.printFunc(`${cl.fg_green}[SOLA] アクセス完了${cl.fg_reset}`);
        await wa.consoleOn("[SOLA] ログイン中・・・");

        const username_input = await this.page.waitForSelector(selectors.username_input, {timeout: 30000});
        const submit_btn = await this.page.waitForSelector(selectors.submit_btn, {timeout: 30000});
        await username_input?.click();
        await username_input?.type(this.userdata.username);//username入力
        await submit_btn?.click();//submitクリック
        const password_input = await this.page.waitForSelector(selectors.password_input, {timeout: 30000});
        await password_input?.click();
        await password_input?.type(this.userdata.password);//password入力

        // SOLAのsubmitボタンが押せないバグの暫定解決法
        // "sola.sus.ac.jp"という文字の入ったresponseを受け取るまでクリックループ
        await errorLoop(20,async()=>{
          if (!this.page)throw new Error("PAGE:UNDEFINED");
          await sleep(200);
          await submit_btn?.click();
          await this.page.waitForResponse((res)=>{
            return  !!(res.url().match("sola.sus.ac.jp"));
          },{timeout:2000});
        });
        this.printFunc(`${cl.bg_green}[SOLA] ログイン完了${cl.fg_reset}`);
        return;
      }catch (e){
        let new_e :Error;
        new_e = (e instanceof Error)?e
            :(typeof e === "string")?new Error(e)
                :new Error("SOLA:UNKNOWN_ERROR");
        switch ((<Error>e).message) {
          case `net::ERR_CONNECTION_REFUSED at ${this.target_URL}`:{
            new_e.message = "SOLA:CONNECTION_REFUSED";
            break;
          }
        }
        throw new_e;
      }finally {
        await wa.consoleOff();
      }
    }
    protected async openEUC() {
      if (!this.page)throw new Error("PAGE:UNDEFINED");//ページ未定義エラー
      if (!this.EUC)throw new Error("EUC:EUC_UNDEFINED");//EUC未定義エラー
      this.printFunc("[EUC登録を行います]");
      //アクセス待機メッセージ
      const wa = new WaitAccessMessage(1000,this.printFunc);
      const selectors = this.selectors.EUC;
      try {
        //SCLASSにヘッドレスでアクセス
        await this.openSCLASS();
        //ダイアログを押すイベントを登録
        this.page.once("dialog", async dialog => {
          await dialog.accept(); // OK
        });
        await wa.consoleOn("[EUC] 登録中...");
        const risyuu_div = await this.page.waitForSelector(selectors.risyuu_div);
        await risyuu_div?.hover();//「履修関連」をホバー
        //「履修登録」のタブが増えてたりしたときのため
        const EUC_link = await this.page.waitForSelector(selectors.EUC_link)
        await EUC_link?.click();//「EUC学生出欠登録」をクリック
        const EUC_input = await this.page.waitForSelector(selectors.EUC_input);//EUC入力フォーム
        const EUC_submit_btn = await this.page.waitForSelector(selectors.EUC_submit_btn);//EUC提出ボタン
        await EUC_input?.click();//EUCの入力
        await EUC_input?.type(this.EUC);//EUCの入力
        await EUC_submit_btn?.click();
        // 結果表示span
        const result_text_span = await this.page.waitForSelector(selectors.result_text_span);
        //EUC登録の結果の文章を取得
        const result_text = await(await result_text_span?.getProperty("textContent"))?.jsonValue()??"番号が異なります。";
        //EUC登録した授業名を取得
        const result_class = await this.page.$eval("span#form1\\:Title", (span) => {
          return (span)?span.textContent?.replace(/[\t\n]/g, ""):"";
        }).catch(() => {
          // 要素がない(番号が異なる)場合は何も返さない
          return "";
        });
        await wa.consoleOff();
        this.printFunc(`${cl.fg_cyan}${(result_class)?result_class+"\n":""}${cl.fg_reset}${cl.fg_red}${result_text}${cl.fg_reset}`); //結果をコンソールに表示
        //「番号が異なります。」が出なかったらスクショ
        if (result_text === "番号が異なります。")return;
        // 以下else
        const shot_target = await this.page.waitForSelector(selectors.shot_target_table);
        const filename = today.getToday();
        try{
          // data/imagesがなければ再帰的に作成
          if (!existsSync("data/images"))mkdirSync("data/images",{recursive:true});
          // スクリーンショットををとり、data/imagesに保存
          await shot_target?.screenshot({
            path: `data/images/${result_class}-${filename}.jpg`,
            type: 'jpeg',
            quality: 100
          });
        }catch (e) {
          throw new Error("EUC:SCREENSHOT_ENOENT");
        }
        // /logs/euc.logファイルがあるか判定。なければ作成あったら追記
        const todayEUC = `授業名：${result_class},EUC番号:${this.EUC},結果:${result_text},日付:${today.getTodayJP()}\n`;
        try{
          // data/logsがなければ再帰的に作成
          if (!existsSync("data/logs"))mkdirSync("data/logs",{recursive:true});
          appendFileSync("data/logs/euc.log", todayEUC, "utf-8");
        }catch (e) {
          throw new Error("EUC:LOG_ENOENT");
        }
      return ;
      }catch (e){
        let new_e :Error;
        new_e = (e instanceof Error)?e
                :(typeof e === "string")?new Error(e)
                :new Error("EUC:UNKNOWN_ERROR");
        throw new_e;
      }finally {
        await wa.consoleOff();
      }
    }
    protected async resizeWindow([w, h]: [number, number]) {
      try {
        if (!this.page)throw new Error("PAGE:UNDEFINED");
        // CDPセッションを作成し、ブラウザに直接値を流し込む
        const session = await this.page.target().createCDPSession();
          const { windowId } = await session.send("Browser.getWindowForTarget");
          await session.send("Browser.setWindowBounds", {
            bounds: {
              height: h,
              width: w,
            },
            windowId: windowId,
          });
          return true;
      } catch (e) {
        throw e;
      }
    }
  }
}
export default Opener;
