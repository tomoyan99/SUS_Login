import * as puppeteer from "puppeteer-core";
import {control as cl} from "../utils/control";
import WaitAccessMessage from "./WaitAccessMessage";
import * as selectors from "./selectors.json";

namespace Opener {
  export type LaunchOption = {
    printFunc?: Function;
    clearFunc?: Function;
    is_app?: boolean;
    is_headless?: boolean;
  }
  export type SiteMode = "SCLASS" | "SOLA" | "EUC";
  export type ModeOption<T extends SiteMode>=
       T extends "SCLASS" ?{ mode: "SCLASS"; }
      :T extends "SOLA"   ?{ mode: "SOLA"  ; solaLink_URL?: string; }
      :T extends "EUC"    ?{ mode: "EUC"   ; EUC?: string; }
      :never;
  export type User = {
    username: string;
    password: string;
  };
  export type Contexts = [puppeteer.Browser, puppeteer.Page];
  export type Selectors = {
    SCLASS: {
      [selector_name: string]: string;
    };
    SOLA: {
      [selector_name: string]: string;
    };
    EUC: {
      [selector_name: string]: string;
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
    protected printFunc: Function; //文字を表示させる関数
    protected clearFunc: Function; //文字を表示させる関数
    private is_headless: boolean; //デフォルトはfalse
    private is_app: boolean; //ブラウザをappモードで開くかどうか(デフォルトはtrue)
    private is_network_connected:boolean; //ネットが繋がっているか
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
      this.mode                 = undefined;
      this.solaLink_URL         = undefined;
      this.is_network_connected = false;
    }
    // 疑似コンストラクタ
    // ブラウザを立ち上げる
    public async launch(option:LaunchOption) {
      this.printFunc = option.printFunc??console.log;
      this.clearFunc = option.clearFunc??console.clear;
      this.is_headless= option.is_headless??false;
      this.is_app     = option.is_app??true;
      // エラーだったら4回リトライ
      [this.browser, this.page] = await this.errorLoop<Contexts>(
        4,
        async () => await this.createContext(),
          `${cl.bg_red}ブラウザの起動に失敗しました${cl.bg_reset}`
      );
      return this;
    }
    public async open(option: ModeOption<SiteMode>): Promise<BrowserOpener> {
      return await this.errorLoop(
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
          },
          "");
    }
    public async close() {
      if (this.browser) {
        await this.browser.close();
        this.browser = undefined;
      }else{
        throw new Error("BROWSER:UNDEFINED");//ブラウザ未定義エラー
      }
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
      if (this.browser){
        return this.browser;
      }else{
        throw "browser is not opened";
      }
    }
    // コールバックを指定回数再試行する
    private async errorLoop<T>(
        max_loop: number,
        func:Function,
        error_message?:string,
    ): Promise<T> {
      let message:Error=new Error("ALL:UNEXPECTED_ERROR");
      for (let i = 1; i <= max_loop; i++) {
        this.clearFunc();
        try {
          return <T>await func();
        } catch (e:unknown) {
          message =  (e instanceof Error)?e
                    :(typeof e === "string")?new Error(e)
                    :message;
        }
      }
        this.clearFunc();
        throw (error_message)?new Error(error_message)
              :message;
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
            this.is_app ? "--app=https://www.google.co.jp/" : "", //appモードがonならappモードで開く
            "--incognito",
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
        throw new Error("BROWSER:NOT_OPEN");
      }
    }
    // requestがあったらHTML,script以外のファイル読み込みを禁止し軽量化
    private async disableCSS() {
      if (this.page) {
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
      } else {
        throw "page is not opened";
      }
    }
    protected async openSCLASS(): Promise<void> {
      if (this.page) {
        // cssをoffに
        if (this.is_headless) await this.disableCSS();
        this.printFunc("[SCLASSにログインします]");
        //アクセス待機メッセージ生成器
        const wa = new WaitAccessMessage(1000, this.printFunc);
        try {
          await wa.consoleOn("[SCLASS] アクセス中...");//アクセス待機メッセージON
          await this.page.goto(this.target_URL, {
            waitUntil: "domcontentloaded",
            timeout: 0,
          });
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
          const pass_input = await this.page.waitForSelector(
              selectors.pass_input,
              { timeout: 30000});
          await pass_input?.click();//クリックして入力箇所の間違いを防ぐ
          await pass_input?.type(this.userdata.password);
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
          switch ((<Error>e).message) {
            case `net::ERR_CONNECTION_REFUSED at ${this.target_URL}`:{
              new_e.message = "SCLASS:CONNECTION_REFUSED";
              break;
            }
          }
          throw new_e;
        }finally {
          await wa.consoleOff();// コンソールメッセージは必ずOFFに
        }
      }
      throw new Error("PAGE:UNDEFINED");//ページ未定義エラー
    }
    protected async openSOLA() {}
    protected async openEUC() {}
    protected async resizeWindow([w, h]: [number, number]) {
      try {
        if (this.page) {
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
        } else {
          throw "this.page is undefined";
        }
      } catch (e) {
        throw e;
      }
    }
  }
}

export default Opener;
