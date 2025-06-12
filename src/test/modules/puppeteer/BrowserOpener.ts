import { Browser, BrowserContext, chromium, Page, Response } from "playwright";
import { control as cl } from "../utils/control";
import WaitAccessMessage from "./WaitAccessMessage";
import Selectors from "./Selectors";
import { User } from "../types/setup";
import { today } from "../utils/today";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { errorLoop } from "../utils/myUtils";

// Launch時のオプション設定
export type LaunchOption = {
  printFunc?: () => void;
  clearFunc?: () => void;
  is_app?: boolean;
  is_headless?: boolean;
  is_secret?: boolean; // PlaywrightではContextレベルで実現
};

// モード設定（SCLASS, SOLA, EUC）の型定義
export type SiteMode = "SCLASS" | "SOLA" | "EUC";

export type ModeOption<T extends SiteMode> = T extends "SCLASS"
  ? { mode: "SCLASS" }
  : T extends "SOLA"
    ? { mode: "SOLA"; solaLink_URL?: string }
    : T extends "EUC"
      ? { mode: "EUC"; EUC: string }
      : never;

// ブラウザを制御するクラス
export class BrowserOpener {
  printFunc: Function;
  protected readonly selectors: Selectors;
  protected browser?: Browser;
  protected context?: BrowserContext;
  protected page?: Page;
  private readonly userdata: User;
  private target_URL = "";
  private EUC?: string;
  private clearFunc: Function;
  private is_headless: boolean = false;
  private is_app: boolean = true;
  private is_secret: boolean = true;
  private is_disabledCSS: boolean = false;
  private wam: WaitAccessMessage;

  constructor(userdata: User) {
    this.userdata = userdata;
    this.printFunc = console.log;
    this.clearFunc = console.clear;
    this.selectors = new Selectors();
    this.wam = new WaitAccessMessage(3000, this.printFunc);
  }

  public async launch(option: LaunchOption): Promise<BrowserOpener> {
    this.applyLaunchOptions(option);
    const result = await errorLoop<[Browser, BrowserContext, Page]>(
      4,
      this.createContext.bind(this),
    );
    this.browser = result[0];
    this.context = result[1];
    this.page = result[2];
    return this;
  }

  public async open(option: ModeOption<SiteMode>, retry?: number): Promise<BrowserOpener> {
    return await errorLoop(retry ?? 4, async () => {
      if (!this.browser?.isConnected()) {
        return this;
      }
      this.changeMode(option);
      await this.navigateAndResize(option.mode);
      return this;
    });
  }

  public onClose(cb: () => void): void {
    this.context?.on("close", cb);
    this.browser?.on("disconnected", () => {
      this.wam.consoleOff();
      cb();
    });
  }

  public async close(): Promise<void> {
    if (this.browser?.isConnected()) {
      await this.browser.close();
      this.browser = undefined;
    } else {
      this.printFunc("[WARN] BROWSER IS ALREADY CLOSED");
    }
  }

  protected async openSCLASS(): Promise<void> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    if (this.is_headless) await this.rejectResources();
    this.printFunc("[SCLASSにログインします]");

    try {
      this.wam.consoleOn("[SCLASS] サイトにアクセスしています...");
      await this.page.goto(this.target_URL, { waitUntil: "domcontentloaded", timeout: 0 });
      this.wam.consoleOff();
      this.printFunc(`${cl.fg_green}[SCLASS] アクセス完了${cl.fg_reset}`);
      this.wam.consoleOn("[SCLASS] ログイン中・・・");

      const selectors = this.selectors.SCLASS;
      await this.page.locator(selectors.username_input).fill(this.userdata.username);
      await this.page.locator(selectors.password_input).fill(this.userdata.password);
      await this.page.locator(selectors.login_btn).click();

      await this.page.waitForLoadState("domcontentloaded", { timeout: 30000 });

      if (this.page.url().includes("/up/faces/up/")) {
        this.printFunc(`${cl.bg_green}[SCLASS] ログイン完了${cl.fg_reset}`);
      } else if (this.page.url().includes("/up/faces/login/")) {
        throw this.handleError(new Error("AUTH_FAILURE"), "SCLASS");
      }
    } catch (e: unknown) {
      throw this.handleError(e, "SCLASS");
    } finally {
      this.wam.consoleOff();
    }
  }

  protected async openSOLA(): Promise<void> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    if (!this.target_URL) throw new Error("SOLA:URL_UNDEFINED");
    this.printFunc("[SOLAにログインします]");

    try {
      if (this.is_headless) await this.rejectResources();
      this.wam.consoleOn("[SOLA] サイトにアクセスしています...");
      await this.page.goto(this.target_URL, { waitUntil: "domcontentloaded", timeout: 0 });
      this.wam.consoleOff();
      this.printFunc(`${cl.fg_green}[SOLA] アクセス完了${cl.fg_reset}`);
      this.wam.consoleOn("[SOLA] ログイン中・・・");

      const selectors = this.selectors.SOLA;
      await this.page.locator(selectors.username_input).fill(this.userdata.username);
      await this.page.locator(selectors.submit_btn).click();

      await this.page.locator(selectors.password_input).fill(this.userdata.password);

      await errorLoop(20, async () => {
        if (!this.page) throw new Error("PAGE:UNDEFINED");
        await this.page.locator(selectors.submit_btn).click();
        await this.page.waitForResponse((res: Response) => res.url().includes("sola.sus.ac.jp"), {
          timeout: 2000,
        });
      });

      await this.page.waitForLoadState("domcontentloaded", { timeout: 30000 });
      this.printFunc(`${cl.bg_green}[SOLA] ログイン完了${cl.fg_reset}`);
    } catch (e) {
      throw this.handleError(e, "SOLA");
    } finally {
      this.wam.consoleOff();
    }
  }

  protected async openEUC(): Promise<void> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    if (!this.EUC) throw new Error("EUC:EUC_UNDEFINED");
    this.printFunc("[EUC登録を行います]");
    const selectors = this.selectors.EUC;

    try {
      await this.openSCLASS();
      this.page.once("dialog", async (dialog) => await dialog.accept());

      this.wam.consoleOn("[EUC] 登録中...");
      await this.page.locator(selectors.risyuu_div).hover();
      await this.page.locator(selectors.EUC_link).click({ delay: 100 });

      await this.page.locator(selectors.EUC_input).fill(this.EUC);
      await this.page.locator(selectors.EUC_submit_btn).click();

      const resultTextSpan = this.page.locator(selectors.result_text_span);
      const resultText = (await resultTextSpan.textContent()) || "番号が異なります。";
      const resultClass =
        (await this.page.locator(selectors.result_class_span).textContent())?.replace(
          /[\t\n]/g,
          "",
        ) || "";

      this.wam.consoleOff();
      this.printFunc(
        `${cl.fg_cyan}${resultClass ? resultClass + "\n" : ""}${cl.fg_reset}${cl.fg_red}${resultText}${cl.fg_reset}`,
      );

      if (resultText === "番号が異なります。") return;

      const shotTarget = this.page.locator(selectors.shot_target_table);
      const filename = today.getToday();

      if (!existsSync("data/images")) mkdirSync("data/images", { recursive: true });
      await shotTarget.screenshot({
        path: `data/images/${resultClass}-${filename}.jpg`,
        type: "jpeg",
        quality: 100,
      });

      const todayEUC = `授業名：${resultClass},EUC番号:${this.EUC},結果:${resultText},日付:${today.getTodayJP()}\n`;
      if (!existsSync("data/logs")) mkdirSync("data/logs", { recursive: true });
      appendFileSync("data/logs/euc.log", todayEUC, "utf-8");
    } catch (e) {
      throw this.handleError(e, "EUC");
    } finally {
      this.page.removeAllListeners("dialog");
      this.wam.consoleOff();
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
    this.wam = new WaitAccessMessage(3000, this.printFunc);
  }

  private async createContext(): Promise<[Browser, BrowserContext, Page]> {
    try {
      const browser = await chromium.launch({
        headless: this.is_headless,
        slowMo: this.is_headless ? 0 : 50,
        channel: "chrome",
        args: this.buildLaunchArgs(),
      });
      const context = await browser.newContext({
        viewport: this.is_headless ? { width: 1280, height: 720 } : null,
        // シークレットモードは newContext で実現
        // is_secret フラグはここで直接は使わないが、argsで --incognito を渡すことで制御
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

  private async navigateAndResize(mode: SiteMode) {
    switch (mode) {
      case "SCLASS":
        await this.openSCLASS();
        await this.resizeWindow([600, 600]);
        break;
      case "SOLA":
        await this.openSOLA();
        await this.resizeWindow([600, 600]);
        break;
      case "EUC":
        await this.openEUC();
        break;
    }
  }

  private changeMode(option: ModeOption<SiteMode>): void {
    switch (option.mode) {
      case "SCLASS":
        this.target_URL = "https://s-class.admin.sus.ac.jp/";
        break;
      case "SOLA":
        this.target_URL = option.solaLink_URL ?? "https://sola.sus.ac.jp/";
        break;
      case "EUC":
        this.target_URL = "https://s-class.admin.sus.ac.jp/";
        this.EUC = option.EUC;
        break;
    }
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

  private async resizeWindow([w, h]: [number, number]) {
    if (!this.page || this.is_headless) return;
    await this.page.setViewportSize({ width: w, height: h });
  }
}
