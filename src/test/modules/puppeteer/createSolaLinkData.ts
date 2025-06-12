import { today } from "../utils/today";
import { control as cl } from "../utils/control";
import { errorLoop, sleep } from "../utils/myUtils";
import { SolaClassRecord, SolaLinkData, User } from "../types/setup";
import { BrowserOpener, LaunchOption } from "./BrowserOpener"; // Playwright版をインポート

type ScheduleItem = { code: string; name: string };
type Schedule = { bf: ScheduleItem[]; af: ScheduleItem[] };

export async function createSolaLinkData(
  user: User,
  subOption?: LaunchOption,
): Promise<SolaLinkData> {
  const scraper = new SolaLinkDataScraper(user);
  const launchOptions: LaunchOption = {
    is_app: subOption?.is_app ?? true,
    is_secret: subOption?.is_secret ?? true,
    is_headless: subOption?.is_headless ?? true,
    printFunc: subOption?.printFunc,
    clearFunc: subOption?.clearFunc,
  };

  return await errorLoop(4, async () => {
    await scraper.launch(launchOptions);
    try {
      const schedule = await scraper.fetchSchedule();
      scraper.printFunc("続いて、SOLAから科目ページリンクの取得を行います");
      const solaLinks: SolaLinkData = await scraper.fetchSolaLinks(schedule);
      scraper.printFunc("履修科目データの登録が完了しました");
      return solaLinks;
    } catch (e) {
      throw e;
    } finally {
      await scraper.close();
    }
  });
}

class SolaLinkDataScraper extends BrowserOpener {
  constructor(userdata: User) {
    super(userdata);
  }

  public async fetchSchedule(): Promise<Schedule> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    try {
      await this.open({ mode: "SCLASS" });
      await this.navigateToSchedulePage();
      const schedule = await this.extractScheduleData();
      this.printFunc(cl.fg_green + "履修科目コード及び科目名取得完了" + cl.fg_reset);
      return schedule;
    } catch (e) {
      throw e;
    }
  }

  public async fetchSolaLinks(schedule: Schedule): Promise<SolaLinkData> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    await this.open({ mode: "SOLA" });

    const fetchLinks = async (items: ScheduleItem[]): Promise<SolaClassRecord[]> => {
      const records: SolaClassRecord[] = [];
      for (const [index, item] of items.entries()) {
        await sleep(index * 800); // 連続アクセスを避ける
        const url = await this.fetchSolaPageUrl(item);
        records.push({ ...item, event: "sola", url });
      }
      return records;
    };

    this.printFunc("前期科目ページURLを取得します・・・");
    const bfLinks = await fetchLinks(schedule.bf);
    this.printFunc(cl.fg_green + "前期科目ページURL取得完了" + cl.fg_reset);

    this.printFunc("後期科目ページURLを取得します・・・");
    const afLinks = await fetchLinks(schedule.af);
    this.printFunc(cl.fg_green + "後期科目ページURL取得完了" + cl.fg_reset);

    return { 前期: bfLinks, 後期: afLinks };
  }

  private async navigateToSchedulePage(): Promise<void> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    const selector = this.selectors.SCHEDULE.SCLASS;
    try {
      await this.page.locator(selector.risyuu_div).hover();
      await this.page.locator(selector.schedule_link).click({ delay: 500 });
      await this.page.locator(selector.term_select).selectOption({ value: "0" });
      await this.page.locator(selector.viewstyle_select).selectOption({ value: "1" });
      await this.page.locator(selector.search_input).click();
      await this.page.waitForSelector(selector.schedule_bf_table);
      await this.page.waitForSelector(selector.schedule_af_table);
    } catch (e) {
      throw new Error("SCRAPE_SCLASS:CONTROL_ERROR");
    }
  }

  private async extractScheduleData(): Promise<Schedule> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    const extractData = async (term: "bf" | "af", className: string): Promise<string[]> => {
      const termNum = { bf: "00", af: "01" }[term];
      const path = `table#form1\\:standardJugyoTimeSchedule${termNum}List td.${className} span,table#form1\\:IrregularJugyoTimeSchedule${termNum}List td.${className} span`;
      const elements = (await this.page
        .locator(path)
        .evaluateAll((els) =>
          els.map((el) => el.textContent?.trim() || "").filter(Boolean),
        )) as string;
      return [...new Set(elements)];
    };
    try {
      const codesBf = await extractData("bf", "jugyoCd");
      const namesBf = await extractData("bf", "jugyoMei");
      const codesAf = await extractData("af", "jugyoCd");
      const namesAf = await extractData("af", "jugyoMei");

      const cleanName = (name: string | undefined) => {
        if (!name) return "取得エラー";
        return name
          .replace(/ (.*?) .*/g, "$1")
          .replace("\t", "")
          .trim();
      };
      return {
        bf: codesBf.map((code, i) => ({ code, name: cleanName(namesBf[i]) })),
        af: codesAf.map((code, i) => ({ code, name: cleanName(namesAf[i]) })),
      };
    } catch (e) {
      throw new Error("SCRAPE_SCLASS:CREATE_SCHEDULE_ERROR");
    }
  }

  private async fetchSolaPageUrl(item: ScheduleItem): Promise<string> {
    if (!this.context) throw new Error("CONTEXT:UNDEFINED");
    const courseUrl = `https://sola.sus.ac.jp/course/search.php?areaids=core_course-course&q=${item.code}`;
    const page = await this.context.newPage();
    const selector = this.selectors.SCHEDULE.SOLA;

    try {
      await page.goto(courseUrl, { waitUntil: "domcontentloaded", timeout: 0 });
      const url = await page
        .locator(selector.last_aalink)
        .getAttribute("href")
        .catch(() => null);
      const yearText = await page
        .locator(selector.last_aalink)
        .textContent()
        .catch(() => null);
      const year = yearText?.split("_")[0] ?? null;

      await page.close();

      if (year && parseInt(year) !== today.getNend()) {
        this.printFunc(`年度が異なります: ${item.name}(${year})。デフォルトURLを返します`);
        return "https://sola.sus.ac.jp/";
      }
      return url ?? "https://sola.sus.ac.jp/";
    } catch (e) {
      await page.close();
      throw new Error("SCRAPE_SOLA:CANNOT_SCRAPE_DATA");
    }
  }
}
