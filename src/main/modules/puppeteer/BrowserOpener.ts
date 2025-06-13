import { Browser, BrowserContext, chromium, Page, Response } from "playwright";
import WaitAccessMessage from "./WaitAccessMessage"; // 修正後のWaitAccessMessageをインポート
import Selectors from "./Selectors";
import { User } from "../types/setup";
import { today } from "../utils/today";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { errorLoop } from "../utils/myUtils";
import { control as cl } from "../utils/control";

// Launch時のオプション設定
export type LaunchOption = {
  printFunc?: (...args: any) => void;
  clearFunc?: () => void;
  is_app?: boolean;
  is_headless?: boolean;
  is_secret?: boolean;
  delay?: number;
};

// モード設定（SCLASS, SOLA, EUC）の型定義
export type SiteMode = "SCLASS" | "SOLA" | "EUC";

export type ModeOption<T extends SiteMode> = {
  SCLASS: { mode: "SCLASS" };
  SOLA: { mode: "SOLA"; solaLink_URL?: string };
  EUC: { mode: "EUC"; EUC: string };
}[T];

// ブラウザを制御するクラス
export class BrowserOpener {
  public printFunc: (...args: any) => void;
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;

  readonly selectors: Selectors;
  private readonly userdata: User;
  private clearFunc: (...args: any) => void;

  private is_headless: boolean = false;
  private is_app: boolean = true;
  private is_secret: boolean = true;
  private delay: number = 0;
  private is_disabledCSS: boolean = false;
  private isWindowManagementHandlerSet = false;

  constructor(userdata: User) {
    this.userdata = userdata;
    this.printFunc = console.log;
    this.clearFunc = console.clear;
    this.selectors = new Selectors();
    // wamの初期化を削除
  }

  public async launch(option: LaunchOption): Promise<BrowserOpener> {
    this.applyLaunchOptions(option);
    const result = await errorLoop<[Browser, BrowserContext, Page]>(4, this.createContext.bind(this));
    [this.browser, this.context, this.page] = result;
    return this;
  }

  public async open(option: ModeOption<SiteMode>, retry?: number): Promise<BrowserOpener> {
    return await errorLoop(retry ?? 4, async () => {
      if (!this.browser?.isConnected() || !this.page) {
        throw new Error("BROWSER_OR_PAGE_NOT_AVAILABLE");
      }
      switch (option.mode) {
        case "SCLASS":
          await this._openSCLASS();
          await this.setupWindowManagement([800, 700]);
          break;
        case "SOLA":
          await this._openSOLA(option.solaLink_URL);
          await this.setupWindowManagement([800, 700]);
          break;
        case "EUC":
          await this._openEUC(option.EUC);
          break;
      }
      return this;
    });
  }

  public onClose(cb: () => void): void {
    this.context?.on("close", cb);
    this.browser?.on("disconnected", cb); // wamの呼び出しを削除
  }

  public async close(): Promise<void> {
    if (this.browser?.isConnected()) {
      await this.browser.close();
      this.browser = undefined;
    } else {
      this.printFunc("[WARN] BROWSER IS ALREADY CLOSED");
    }
  }

  private async _openSCLASS(): Promise<void> {
    const wam = new WaitAccessMessage("SCLASS");
    try {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      wam.consoleOn("サイトにアクセス中...");
      if (this.is_headless) await this.rejectResources();

      await this.page.goto("https://s-class.admin.sus.ac.jp/", {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      wam.updateMessage("ログイン情報を入力中...");
      const selectors = this.selectors.SCLASS;
      await this.page.locator(selectors.username_input).fill(this.userdata.username);
      await this.page.locator(selectors.password_input).fill(this.userdata.password);

      wam.updateMessage("ログイン処理中...");
      await this.page.locator(selectors.login_btn).click();
      await this.page.waitForLoadState("domcontentloaded", { timeout: 30000 });

      if (this.page.url().includes("/up/faces/login/")) throw new Error("AUTH_FAILURE");
      if (!this.page.url().includes("/up/faces/up/")) throw new Error("LOGIN_UNEXPECTED_PAGE");

      wam.consoleOff(true, "ログイン成功");
    } catch (e) {
      wam.consoleOff(false, "ログインに失敗しました");
      throw this.handleError(e, "SCLASS");
    }
  }

  private async _openSOLA(solaLink_URL?: string): Promise<void> {
    const wam = new WaitAccessMessage("SOLA");
    const target_URL = solaLink_URL ?? "https://sola.sus.ac.jp/";
    try {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      wam.consoleOn("サイトにアクセス中...");
      if (this.is_headless) await this.rejectResources();

      await this.page.goto(target_URL, { waitUntil: "domcontentloaded", timeout: 0 });

      wam.updateMessage("ユーザーIDを入力中...");
      const selectors = this.selectors.SOLA;
      await this.page.locator(selectors.username_input).fill(this.userdata.username);
      await this.page.locator(selectors.submit_btn).click();

      wam.updateMessage("パスワードを入力中...");
      await this.page.locator(selectors.password_input).fill(this.userdata.password);

      wam.updateMessage("ログイン処理中...");
      await errorLoop(20, async () => {
        if (!this.page) throw new Error("PAGE:UNDEFINED");
        await this.page.locator(selectors.submit_btn).click();
        await this.page.waitForResponse((res: Response) => res.url().includes("sola.sus.ac.jp"), {
          timeout: 2000,
        });
      });

      await this.page.waitForLoadState("domcontentloaded", { timeout: 30000 });
      wam.consoleOff(true, "ログイン成功");
    } catch (e) {
      wam.consoleOff(false, "ログインに失敗しました");
      throw this.handleError(e, "SOLA");
    }
  }

  private async _openEUC(eucCode: string): Promise<void> {
    if (!eucCode) throw new Error("EUC:EUC_UNDEFINED");

    // EUC登録の前にSCLASSにログイン (この中の進捗表示は_openSCLASSメソッドに任せる)
    await this._openSCLASS();

    const wam = new WaitAccessMessage("EUC");
    try {
      if (!this.page) throw new Error("PAGE:UNDEFINED");
      wam.consoleOn("登録ページに移動中...");
      this.page.once("dialog", async (dialog) => await dialog.accept());

      const selectors = this.selectors.EUC;
      await this.page.locator(selectors.risyuu_div).hover();
      await this.page.waitForSelector(selectors.EUC_link,{state:"visible"});
      await this.page.locator(selectors.EUC_link).click({delay:200,force:true});

      wam.updateMessage("EUC番号を入力して登録中...");
      await this.page.locator(selectors.EUC_input).fill(eucCode);
      await this.page.locator(selectors.EUC_submit_btn).click();

      const resultTextSpan = this.page.locator(selectors.result_text_span);
      const resultText = (await resultTextSpan.textContent()) || "番号が異なります。";
      const resultClassSpan = this.page.locator(selectors.result_class_span);
      let resultClassText = "";
      if (await resultClassSpan.isVisible()) {
        resultClassText = (await resultClassSpan.textContent())?.replace(/[\t\n]/g, "") || "";
      }

      // 登録結果に関わらず、ここまでの処理は「成功」としてスピナーを停止
      wam.consoleOff(true, "登録処理完了");

      // 完了メッセージとは別に行う、結果の詳細表示
      this.printFunc(
        `${cl.fg_cyan}${resultClassText ? "授業名: " + resultClassText + "\n" : ""}${cl.fg_reset}${cl.fg_red}結果: ${resultText}${cl.fg_reset}`,
      );

      if (resultText === "番号が異なります。") return;

      const shotTarget = this.page.locator(selectors.shot_target_table);
      const filename = today.getToday();

      if (!existsSync("data/images")) mkdirSync("data/images", { recursive: true });
      await shotTarget.screenshot({
        path: `data/images/${resultClassText}-${filename}.jpg`,
        type: "jpeg",
        quality: 100,
      });

      const todayEUC = `授業名：${resultClassText},EUC番号:${eucCode},結果:${resultText},日付:${today.getTodayJP()}\n`;
      if (!existsSync("data/logs")) mkdirSync("data/logs", { recursive: true });
      appendFileSync("data/logs/euc.log", todayEUC, "utf-8");

    } catch (e) {
      wam.consoleOff(false, "登録処理に失敗しました");
      throw this.handleError(e, "EUC");
    } finally {
      this.page?.removeAllListeners("dialog");
    }
  }

  protected async rejectResources() {
    if (!this.context || this.is_disabledCSS) return;
    await this.context.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });
    this.is_disabledCSS = true;
  }

  private applyLaunchOptions(option: LaunchOption): void {
    this.printFunc = option.printFunc ?? console.log;
    this.clearFunc = option.clearFunc ?? console.clear;
    this.is_headless = option.is_headless ?? false;
    this.is_app = option.is_app ?? true;
    this.is_secret = option.is_secret ?? true;
    this.delay = option.delay ?? (this.is_headless ? 200 : 500);
    // wamの初期化を削除
  }

  // createContext, buildLaunchArgs, handleError, setupWindowManagementは変更なし
  // ... (以下、変更のないメソッドは省略せずに記載)
  private async createContext(): Promise<[Browser, BrowserContext, Page]> {
    try {
      const browser = await chromium.launch({
        headless: this.is_headless,
        slowMo: this.delay,
        channel: "chrome",
        args: this.buildLaunchArgs(),
      });
      const context = await browser.newContext({
        viewport: null,
      });
      const page = await context.newPage();
      return [browser, context, page];
    } catch (e) {
      console.error(e);
      throw new Error("BROWSER:CANNOT_OPEN");
    }
  }

  private buildLaunchArgs(): string[] {
    return [
      ...(this.is_app ? ["--app=https://www.google.co.jp/"] : []),
      ...(this.is_headless || !this.is_secret ? [] : ["--incognito"]),
      "--window-position=0,0",
      this.is_headless ? "--start-maximized" : "--window-size=600,600",
      "--proxy-server='direct://'",
      "--proxy-bypass-list=*",
    ];
  }

  private handleError(e: unknown, source: string): Error {
    let errorMessage = `[${source}] UNKNOWN_ERROR`;
    if (e instanceof Error) {
      errorMessage = e.message.includes("net::ERR_CONNECTION_REFUSED")
        ? `[${source}] CONNECTION_REFUSED`
        : `[${source}] ${e.message}`;
      e.message = errorMessage;
      return e;
    } else if (typeof e === "string") {
      errorMessage = `[${source}] ${e}`;
      return new Error(errorMessage);
    }
    return new Error(errorMessage);
  }

  private async setupWindowManagement([w, h]: [number, number]) {
    if (this.is_headless || !this.page || !this.context) return;

    try {
      const session = await this.context.newCDPSession(this.page);
      const { windowId } = await session.send("Browser.getWindowForTarget");
      await session.send("Browser.setWindowBounds", {
        windowId,
        bounds: { width: w, height: h, left: 0, top: 0 },
      });
      await session.detach();
    } catch (e: any) {
      this.printFunc(`[WARN] Could not resize initial window: ${e.message}`);
    }

    if (this.isWindowManagementHandlerSet) return;
    this.isWindowManagementHandlerSet = true;

    this.context.on("page", async (newPage) => {
      try {
        await newPage.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
        const pages = this.context?.pages() ?? [];
        if (pages.length < 2) return;

        const previousPage = pages[pages.length - 2];
        const prevSession = await this.context!.newCDPSession(previousPage);
        const { windowId: prevWindowId } = await prevSession.send("Browser.getWindowForTarget");
        const { bounds: prevBounds } = await prevSession.send("Browser.getWindowBounds", {
          windowId: prevWindowId,
        });
        await prevSession.detach();

        const newLeft = (prevBounds.left ?? 0) + 30;
        const newTop = (prevBounds.top ?? 0) + 30;

        const newSession = await this.context!.newCDPSession(newPage);
        const { windowId: newWindowId } = await newSession.send('Browser.getWindowForTarget');

        const { windowState, ...newWindowBounds } = prevBounds;

        await newSession.send('Browser.setWindowBounds', {
          windowId: newWindowId,
          bounds: { ...newWindowBounds, left: newLeft, top: newTop },
        });
        await newSession.detach();
      } catch (e: any) {
        this.printFunc(`[WARN] Could not position new window: ${e.message}`);
      }
    });
  }
}
