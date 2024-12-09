import * as puppeteer from "puppeteer-core";
import {control as cl} from "../utils/control";
import WaitAccessMessage from "./WaitAccessMessage";
import Selectors from "./Selectors";
import {User} from "../main/setup";
import {today} from "../utils/today";
import {appendFileSync, existsSync, mkdirSync} from "fs";
import {errorLoop, sleep} from "../utils/myUtils";

// Opener namespace定義
namespace Opener {
  // Launch時のオプション設定
  export type LaunchOption = {
    printFunc?: Function;         // ログ出力関数
    clearFunc?: Function;         // 画面クリア関数
    is_app?: boolean;             // アプリモードの指定
    is_headless?: boolean | "shell";  // ヘッドレスモードの指定
    is_secret?: boolean;          // シークレットモードの指定
  };
  export type Contexts = [puppeteer.Browser, puppeteer.Page];
  // モード設定（SCLASS, SOLA, EUC）の型定義
  export type SiteMode = "SCLASS" | "SOLA" | "EUC";
  export type ModeOption<T extends SiteMode> =
      T extends "SCLASS" ? { mode: "SCLASS" }
          : T extends "SOLA" ? { mode: "SOLA"; solaLink_URL?: string }
              : T extends "EUC" ? { mode: "EUC"; EUC: string }
                  : never;

  // ブラウザを制御するクラス
  export class BrowserOpener {
    private mode?: SiteMode;                // サイトモードを保持
    private readonly userdata: User;        // ユーザー情報
    private target_URL = "";          // ターゲットURL
    protected readonly selectors:Selectors;
    private EUC?: string;                   // EUC専用のプロパティ
    private solaLink_URL?: string;          // SOLA専用のプロパティ
    protected browser?: puppeteer.Browser;    // PuppeteerのBrowserインスタンス
    protected page?: puppeteer.Page;          // PuppeteerのPageインスタンス
    printFunc: Function;            // ログ出力関数
    private clearFunc: Function;            // 画面クリア関数
    private is_headless: boolean | "shell" = false; // ヘッドレスモードフラグ
    private is_app: boolean = true;         // アプリモードフラグ
    private is_secret: boolean = true;      // シークレットモードフラグ

    // コンストラクタ
    constructor(userdata: User) {
      this.userdata = userdata;
      this.printFunc = console.log;
      this.clearFunc = console.clear;
      this.selectors = new Selectors();
    }

    // ブラウザ起動
    public async launch(option: LaunchOption) {
      this.applyLaunchOptions(option);      // オプションの適用
      [this.browser, this.page] = await errorLoop<Contexts>( // エラーループ付きでブラウザ起動
          4,
          this.createContext.bind(this)
      );
      return this;
    }

    // 指定モードでサイトを開く
    public async open(option: ModeOption<SiteMode>): Promise<BrowserOpener> {
      return await errorLoop(4, async () => { // エラーループ付き
        if (!this.browser || (await this.browser.pages()).length === 0) {
          throw new Error("BROWSER:CLOSED");
        }
        this.changeMode(option);           // モード変更
        await this.navigateAndResize(option.mode); // サイトアクセスとリサイズ
        return this;
      });
    }

    // ブラウザを閉じる
    public async close() {
      if (!this.browser) throw new Error("BROWSER:UNDEFINED");
      await this.browser.close();
      this.browser = undefined;
    }

    // オプション設定を適用
    private applyLaunchOptions(option: LaunchOption) {
      this.printFunc = option.printFunc ?? console.log;
      this.clearFunc = option.clearFunc ?? console.clear;
      this.is_headless = option.is_headless ?? false;
      this.is_app = option.is_app ?? true;
      this.is_secret = option.is_secret ?? true;
    }

    // ブラウザとページの作成
    private async createContext(): Promise<[puppeteer.Browser, puppeteer.Page]> {
      try {
        const browser = await puppeteer.launch({
          headless: this.is_headless ? "shell" : false,
          slowMo: this.is_headless ? 0 : 1,
          defaultViewport: null,
          channel: "chrome",
          timeout: 0,
          ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
          args: this.buildLaunchArgs(),
        });
        return [browser, (await browser.pages())[0]];
      } catch {
        throw new Error("BROWSER:CANNOT_OPEN");
      }
    }

    // Puppeteerの引数を生成
    private buildLaunchArgs(): string[] {
      return [
        ...(this.is_app ? ["--app=https://www.google.co.jp/"] : []),
        ...(this.is_headless || !this.is_secret ? [] : ["--incognito"]),
        "--window-position=9999,9999",
        this.is_headless ? "--window-size=1200,1200" : "--window-size=0,0",
        "--proxy-server='direct://'",
        "--proxy-bypass-list=*",
        "--test-type",
      ];
    }

    // サイトアクセスとウィンドウのリサイズ
    private async navigateAndResize(mode: SiteMode) {
      switch (mode) {
        case "SCLASS":
          await this.openSCLASS();
          await this.resizeWindow([800, 600]);
          break;
        case "SOLA":
          await this.openSOLA();
          await this.resizeWindow([800, 600]);
          break;
        case "EUC":
          await this.openEUC();
          await this.close();
          break;
      }
    }

    // モードを変更し、ターゲットURLを設定
    private changeMode(option: ModeOption<SiteMode>): void {
      this.mode = option.mode;
      switch (option.mode) {
        case "SCLASS":
          this.target_URL = "https://s-class.admin.sus.ac.jp/";
          break;
        case "SOLA":
          this.target_URL = option.solaLink_URL ?option.solaLink_URL:"https://sola.sus.ac.jp/";
          break;
        case "EUC":
          this.target_URL = "https://s-class.admin.sus.ac.jp/";
          this.EUC = option.EUC;
          break;
      }
    }
    // エラーハンドリング共通関数
    private handleError(e: unknown, source: string): Error {
      let errorMessage = `${source}:UNKNOWN_ERROR`;

      if (e instanceof Error) {
        errorMessage = e.message.includes("net::ERR_CONNECTION_REFUSED")
            ? `${source}:CONNECTION_REFUSED`
            : `${source}:${e.message}`;
      } else if (typeof e === "string") {
        errorMessage = `${source}:${e}`;
      }

      return new Error(errorMessage);
    }

    // SCLASSサイトにアクセスしログイン
    protected async openSCLASS(): Promise<void> {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      if (this.is_headless) await this.disableCSS();
      this.printFunc("[SCLASSにログインします]");
      const wa = new WaitAccessMessage(1000, this.printFunc);

      try {
        await wa.consoleOn("[SCLASS] サイトにアクセスしています...");
        await this.page.goto(this.target_URL, { waitUntil: "domcontentloaded", timeout: 0 });
        await wa.consoleOff();
        this.printFunc(`${cl.fg_green}[SCLASS] アクセス完了${cl.fg_reset}`);
        await wa.consoleOn("[SCLASS] ログイン中・・・");

        const selectors = this.selectors.SCLASS;
        const logout_btn = await this.page.waitForSelector(selectors.logout_btn, { timeout: 30000 });
        await logout_btn?.click();

        const username_input = await this.page.waitForSelector(selectors.username_input, { timeout: 30000 });
        await username_input?.click();
        await username_input?.type(this.userdata.username);

        const password_input = await this.page.waitForSelector(selectors.password_input, { timeout: 30000 });
        await password_input?.click();
        await password_input?.type(this.userdata.password);

        const login_btn = await this.page.waitForSelector(selectors.login_btn, { timeout: 30000 });
        await login_btn?.click();

        await this.page.waitForSelector("body", { timeout: 0 });

        if (this.page.url().match("https://s-class.admin.sus.ac.jp/up/faces/up/")) {
          this.printFunc(`${cl.bg_green}[SCLASS] ログイン完了${cl.fg_reset}`);
        } else if (this.page.url().match("https://s-class.admin.sus.ac.jp/up/faces/login/")) {
          throw this.handleError(new Error("AUTH_FAILURE"), "SCLASS");
        }
      } catch (e: unknown) {
        throw this.handleError(e, "SCLASS");
      } finally {
        await wa.consoleOff();
      }
    }

    // SOLAサイトにアクセスしログイン
    protected async openSOLA(): Promise<void> {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      if (!this.target_URL) throw new Error("SOLA:URL_UNDEFINED");
      this.printFunc("[SOLAにログインします]");
      const wa = new WaitAccessMessage(1000, this.printFunc);

      try {
        if (this.is_headless) await this.disableCSS();
        await wa.consoleOn("[SOLA] サイトにアクセスしています...");
        await this.page.goto(this.target_URL, { waitUntil: 'domcontentloaded', timeout: 0 });
        await wa.consoleOff();
        this.printFunc(`${cl.fg_green}[SOLA] アクセス完了${cl.fg_reset}`);
        await wa.consoleOn("[SOLA] ログイン中・・・");

        const selectors = this.selectors.SOLA;
        const username_input = await this.page.waitForSelector(selectors.username_input, { timeout: 30000 });
        const submit_btn = await this.page.waitForSelector(selectors.submit_btn, { timeout: 30000 });

        await username_input?.click();
        await username_input?.type(this.userdata.username);
        await submit_btn?.click();

        const password_input = await this.page.waitForSelector(selectors.password_input, { timeout: 30000 });
        await password_input?.click();
        await password_input?.type(this.userdata.password);

        await errorLoop(20, async () => {
          if (!this.page) throw new Error("PAGE:UNDEFINED");
          await sleep(200);
          await submit_btn?.click();
          await this.page.waitForResponse(res => !!(res.url().match("sola.sus.ac.jp")), { timeout: 2000 });
        });
        // SOLAのbodyの表示を待つ
        await this.page.waitForSelector("body#page-site-index",{timeout: 10000});
        this.printFunc(`${cl.bg_green}[SOLA] ログイン完了${cl.fg_reset}`);
      } catch (e) {
        throw this.handleError(e, "SOLA");
      } finally {
        await wa.consoleOff();
      }
    }

    // EUCサイトにアクセスし登録
    protected async openEUC(): Promise<void> {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      if (!this.EUC) throw new Error("EUC:EUC_UNDEFINED");
      this.printFunc("[EUC登録を行います]");
      const wa = new WaitAccessMessage(1000, this.printFunc);
      const selectors = this.selectors.EUC;

      try {
        await this.openSCLASS();
        this.page.once("dialog", async dialog => await dialog.accept());

        await wa.consoleOn("[EUC] 登録中...");
        const risyuu_div = await this.page.waitForSelector(selectors.risyuu_div);
        await risyuu_div?.hover();

        const EUC_link = await this.page.waitForSelector(selectors.EUC_link);
        await EUC_link?.click();

        const EUC_input = await this.page.waitForSelector(selectors.EUC_input);
        const EUC_submit_btn = await this.page.waitForSelector(selectors.EUC_submit_btn);
        await EUC_input?.click();
        await EUC_input?.type(this.EUC);
        await EUC_submit_btn?.click();

        const result_text_span = await this.page.waitForSelector(selectors.result_text_span);
        const result_text = (await result_text_span?.evaluate(el => el.textContent)) || "番号が異なります。";
        const result_class = await this.page.$eval("span#form1\\:Title", span => span?.textContent?.replace(/[\t\n]/g, "") || "");

        await wa.consoleOff();
        this.printFunc(`${cl.fg_cyan}${result_class ? result_class + "\n" : ""}${cl.fg_reset}${cl.fg_red}${result_text}${cl.fg_reset}`);

        if (result_text === "番号が異なります。") return;

        const shot_target = await this.page.waitForSelector(selectors.shot_target_table);
        const filename = today.getToday();

        if (!existsSync("data/images")) mkdirSync("data/images", { recursive: true });
        await shot_target?.screenshot({ path: `data/images/${result_class}-${filename}.jpg`, type: 'jpeg', quality: 100 });

        const todayEUC = `授業名：${result_class},EUC番号:${this.EUC},結果:${result_text},日付:${today.getTodayJP()}\n`;
        if (!existsSync("data/logs")) mkdirSync("data/logs", { recursive: true });
        appendFileSync("data/logs/euc.log", todayEUC, "utf-8");

      } catch (e) {
        throw this.handleError(e, "EUC");
      } finally {
        await wa.consoleOff();
      }
    }

    // ヘッドレス時のCSS・画像無効化
    protected async disableCSS() {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      await this.page.setRequestInterception(true);
      this.page.on("request", (req) =>
          ["image", "stylesheet", "font"].includes(req.resourceType())
              ? req.abort()
              : req.continue()
      );
    }

    // ウィンドウサイズの変更
    private async resizeWindow([w, h]: [number, number]) {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      const session = await this.page.createCDPSession();
      const { windowId } = await session.send("Browser.getWindowForTarget");
      await session.send("Browser.setWindowBounds", {
        windowId,
        bounds: { width: w, height: h,left: 0, top: 0 },
      });
    }
  }
}
export default Opener;
