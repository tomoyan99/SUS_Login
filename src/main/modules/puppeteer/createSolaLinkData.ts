import { today } from "../utils/today";
import { control as cl } from "../utils/control";
import { errorLoop, sleep } from "../utils/myUtils";
import { SolaClassRecord, SolaLinkData, User } from "../../../types/setup";
import { BrowserOpener, LaunchOption } from "./BrowserOpener";
import { Page } from "playwright";

type ScheduleItem = { code: string; name: string };
type Schedule = { bf: ScheduleItem[]; af: ScheduleItem[] };

/**
 * メインの実行関数。SolaLinkDataScraperを初期化し、データ取得プロセスを開始する
 */
export async function createSolaLinkData(
  user: User,
  subOption?: LaunchOption,
): Promise<SolaLinkData> {
  const scraper = new SolaLinkDataScraper(user, subOption);
  return await scraper.scrape();
}

/**
 * S-CLASSとSOLAをスクレイピングして履修データを作成するクラス
 */
class SolaLinkDataScraper {
  private browserOpener: BrowserOpener;
  private launchOptions: LaunchOption;

  constructor(user: User, subOption?: LaunchOption) {
    this.launchOptions = {
      is_app: subOption?.is_app ?? true,
      is_secret: subOption?.is_secret ?? true,
      is_headless: subOption?.is_headless ?? true,
      printFunc: subOption?.printFunc,
      clearFunc: subOption?.clearFunc,
    };
    this.browserOpener = new BrowserOpener(user);
  }

  /**
   * スクレイピング処理全体を実行する
   */
  public async scrape(): Promise<SolaLinkData> {
    return await errorLoop(4, async () => {
      await this.browserOpener.launch(this.launchOptions);
      try {
        const schedule = await this._fetchSchedule();
        this.browserOpener.printFunc("続いて、SOLAから科目ページリンクの取得を行います");
        const solaLinks = await this._fetchSolaLinks(schedule);
        this.browserOpener.printFunc("履修科目データの登録が完了しました");
        return solaLinks;
      } finally {
        await this.browserOpener.close();
      }
    });
  }

  /**
   * S-CLASSから時間割情報を取得する
   */
  private async _fetchSchedule(): Promise<Schedule> {
    await this.browserOpener.open({ mode: "SCLASS" });
    await this._navigateToSchedulePage();
    const schedule = await this._extractScheduleData();
    this.browserOpener.printFunc(`${cl.fg_green}履修科目コード及び科目名取得完了${cl.fg_reset}`);
    return schedule;
  }

  /**
   * 時間割情報を基に、SOLAから各科目のURLを取得する
   */
  private async _fetchSolaLinks(schedule: Schedule): Promise<SolaLinkData> {
    if (!this.browserOpener.context) throw new Error("CONTEXT:UNDEFINED");
    await this.browserOpener.open({ mode: "SOLA" });

    const searchPage = await this.browserOpener.context.newPage();
    const solaLinkData: SolaLinkData = { "前期": [], "後期": [] };

    const terms: { name: "前期" | "後期"; items: ScheduleItem[] }[] = [
      { name: "前期", items: schedule.bf },
      { name: "後期", items: schedule.af },
    ];

    try {
      for (const term of terms) {
        this.browserOpener.printFunc(`${term.name}科目ページURLを取得します・・・`);
        const records: SolaClassRecord[] = [];
        for (const [index, item] of term.items.entries()) {
          await sleep(index * 800); // 連続アクセスを避ける
          const url = await this._fetchSolaPageUrl(item, searchPage);
          records.push({ ...item, event: "sola", url });
        }
        solaLinkData[term.name] = records;
        this.browserOpener.printFunc(`${cl.fg_green}${term.name}科目ページURL取得完了${cl.fg_reset}`);
      }
    } finally {
      await searchPage.close();
    }

    return solaLinkData;
  }

  /**
   * S-CLASSの時間割ページへ移動する
   */
  private async _navigateToSchedulePage(): Promise<void> {
    const page = this.browserOpener.page;
    if (!page) throw new Error("PAGE:UNDEFINED");
    const selector = this.browserOpener.selectors.SCHEDULE.SCLASS;
    try {
      await page.locator(selector.risyuu_div).hover();
      await page.locator(selector.schedule_link).click({ delay: 500 });
      await page.locator(selector.term_select).selectOption({ value: "0" });
      await page.locator(selector.viewstyle_select).selectOption({ value: "1" });
      await page.locator(selector.search_input).click();
    } catch (e) {
      throw new Error("SCRAPE_SCLASS:CONTROL_ERROR");
    }
  }

  /**
   * 時間割テーブルから科目コードと科目名を抽出する (非同期処理)
   */
  private async _extractScheduleData(): Promise<Schedule> {
    try {
      const [codesBf, namesBf, codesAf, namesAf] = await Promise.all([
        this._extractTermData("bf", "jugyoCd"),
        this._extractTermData("bf", "jugyoMei"),
        this._extractTermData("af", "jugyoCd"),
        this._extractTermData("af", "jugyoMei"),
      ]);

      const cleanName = (name: string): string =>
        name.replace(/ (.*?) .*/g, "$1").replace("\t", "").trim();

      return {
        bf: codesBf.map((code, i) => ({ code, name: cleanName(namesBf[i] ?? "取得エラー") })),
        af: codesAf.map((code, i) => ({ code, name: cleanName(namesAf[i] ?? "取得エラー") })),
      };
    } catch (e) {
      throw new Error("SCRAPE_SCLASS:CREATE_SCHEDULE_ERROR");
    }
  }

  /**
   * 指定された学期とクラス名のデータをテーブルから抽出するヘルパー関数
   */
  private async _extractTermData(term: "bf" | "af", className: string): Promise<string[]> {
    const page = this.browserOpener.page;
    if (!page) return [];

    const termNum = term === "bf" ? "00" : "01";
    const path = `table#form1\\:standardJugyoTimeSchedule${termNum}List td.${className} span,table#form1\\:IrregularJugyoTimeSchedule${termNum}List td.${className} span`;
    const elements = await page.locator(path).evaluateAll((els) =>
      els.map((el) => el.textContent?.trim() || "").filter(Boolean),
    );
    return [...new Set(elements)];
  }

  /**
   * SOLAで科目を検索し、そのURLを返す (タブを再利用)
   */
  private async _fetchSolaPageUrl(item: ScheduleItem, page: Page): Promise<string> {
    const courseUrl = `https://sola.sus.ac.jp/course/search.php?areaids=core_course-course&q=${item.code}`;
    const selector = this.browserOpener.selectors.SCHEDULE.SOLA;

    try {
      await page.goto(courseUrl, { waitUntil: "domcontentloaded", timeout: 0 });
      const linkLocator = page.locator(selector.last_aalink);

      const url = await linkLocator.getAttribute("href").catch(() => null);
      const yearText = await linkLocator.textContent().catch(() => null);
      const year = yearText?.split("_")[0] ?? null;

      if (year && parseInt(year) !== today.getNend()) {
        this.browserOpener.printFunc(`年度が異なります: ${item.name}(${year})。デフォルトURLを返します`);
        return "https://sola.sus.ac.jp/";
      }
      return url ?? "https://sola.sus.ac.jp/";
    } catch (e) {
      this.browserOpener.printFunc(`[WARN] URL取得中にエラーが発生しました: ${item.name}`);
      return "https://sola.sus.ac.jp/"; // エラー時もデフォルトURLを返す
    }
  }
}
