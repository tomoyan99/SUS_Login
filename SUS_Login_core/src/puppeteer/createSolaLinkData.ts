import {today} from "../utils/today";
import {control as cl} from "../utils/control";
import {errorLoop, sleep} from "../utils/myUtils";
import {SolaClassRecord, SolaLinkData, User} from "../main/setup";
import Opener from "./BrowserOpener";
import LaunchOption = Opener.LaunchOption;

type ScheduleItem = { code: string; name: string };
type Schedule = { bf: ScheduleItem[]; af: ScheduleItem[] };

export async function createSolaLinkData(user: User, subOption?: LaunchOption): Promise<SolaLinkData> {
  let scraper = new SolaLinkDataScraper(user);
  const launchOptions = {
    is_app: subOption?.is_app??true,
    is_secret: subOption?.is_secret??true,
    is_headless: subOption?.is_headless ?? true,
  };

  return await errorLoop(4, async () => {
    scraper = await scraper.launch(launchOptions);
    try {
      const schedule = await scraper.searchSclass();
      scraper.printFunc("続いて、SOLAから科目ページリンクの取得を行います");
      const solaLinks: SolaLinkData = await scraper.searchSola(schedule);
      scraper.printFunc("履修科目データの登録が完了しました");
      return solaLinks;
    } catch (e) {
      throw e;
    } finally {
      if (scraper.getBrowser()) await scraper.close();
    }
  });
}

class SolaLinkDataScraper extends Opener.BrowserOpener {
  constructor(option: User & LaunchOption) {
    super(option);
  }

  async searchSclass(): Promise<Schedule> {
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

  private async navigateToSchedulePage(): Promise<void> {
    const selector = this.selectors.SCHEDULE.SCLASS;
    try {
      const risyuuDiv = await this.page?.waitForSelector(selector.risyuu_div);
      await risyuuDiv?.hover(); //「履修関連」をホバー
      const scheduleLink = await this.page?.waitForSelector(selector.schedule_link);
      await scheduleLink?.click({ delay: 500 }); //授業時間割をクリック
      const termSelect = await this.page?.waitForSelector(selector.term_select);
      const viewstyleSelect = await this.page?.waitForSelector(selector.viewstyle_select);
      const searchInput = await this.page?.waitForSelector(selector.search_input);

      await termSelect?.select("0"); // 学期の選択：通年
      await viewstyleSelect?.select("1"); // 表示形式の選択：一覧表示
      await searchInput?.click(); // submitをクリック

      await this.page?.waitForSelector(selector.schedule_bf_table); // 前期tableの表示を待つ
      await this.page?.waitForSelector(selector.schedule_af_table); // 後期tableの表示を待つ
    } catch (e) {
      throw new Error("SCRAPE_SCLASS:CONTROL_ERROR");
    }
  }

  private async extractScheduleData(): Promise<Schedule> {
    const selector = this.selectors.SCHEDULE.SCLASS;

    const extractData = async (term:"bf"|"af",className: string): Promise<string[]> => {
      const termNum = {"bf":"00","af":"01"}[term];
      const path = `table#form1\\:standardJugyoTimeSchedule${termNum}List td.${className} span`;
      return await this.page?.$$eval(path, (elements) =>
          elements.map((el) => el.textContent?.trim() || "").filter(Boolean)
      ) ?? [];
    };

    try {
      const codesBf = await extractData("bf","jugyoCd");
      const namesBf = await extractData("bf","jugyoMei");
      const codesAf = await extractData("af","jugyoCd_af");
      const namesAf = await extractData("af","jugyoMei_af");

      const cleanName = (name: string) =>
          name.replace(/ (.*?) .*/g, "$1").replace("\t", "").trim();

      return {
        bf: codesBf.map((code, i) => ({ code, name: cleanName(namesBf[i]) })),
        af: codesAf.map((code, i) => ({ code, name: cleanName(namesAf[i]) })),
      };
    } catch (e) {
      throw new Error("SCRAPE_SCLASS:CREATE_SCHEDULE_ERROR");
    }
  }

  async searchSola(schedule: Schedule): Promise<SolaLinkData> {
    if (!this.page) throw new Error("PAGE:UNDEFINED");
    await this.open({ mode: "SOLA" });

    const fetchLinks = async (items: ScheduleItem[]): Promise<SolaClassRecord[]> => {
      return Promise.all(
          items.map(async (item, index):Promise<SolaClassRecord> => {
            await sleep(index * 800);
            const url = await this.fetchSolaPageUrl(item);
            return { ...item, event: "sola", url };
          })
      );
    };

    this.printFunc("前期科目ページURLを取得します・・・");
    const bfLinks = await fetchLinks(schedule.bf);
    this.printFunc(cl.fg_green + "前期科目ページURL取得完了" + cl.fg_reset);

    this.printFunc("後期科目ページURLを取得します・・・");
    const afLinks = await fetchLinks(schedule.af);
    this.printFunc(cl.fg_green + "後期科目ページURL取得完了" + cl.fg_reset);

    return { "前期": bfLinks, "後期": afLinks };
  }

  private async fetchSolaPageUrl(item: ScheduleItem): Promise<string> {
    if (!this.browser) throw new Error("BROWSER:UNDEFINED");

    const courseUrl = `https://sola.sus.ac.jp/course/search.php?areaids=core_course-course&q=${item.code}`;
    const page = await this.browser.newPage();
    const selector = this.selectors.SCHEDULE.SOLA;

    try {
      await page.goto(courseUrl, { waitUntil: "domcontentloaded", timeout: 0 });
      const url = await page.$eval(selector.last_aalink, (el) => (<HTMLAnchorElement>el).href).catch(() => null);
      const year = await page.$eval(selector.last_aalink, (el) =>
          el.textContent?.split("_")[0] ?? null
      );

      await page.close();

      if (year && parseInt(year) !== today.getNend()) {
        this.printFunc("年度が異なります: デフォルトURLを返します");
        return "https://sola.sus.ac.jp/";
      }
      return url ?? "https://sola.sus.ac.jp/";
    } catch (e) {
      await page.close();
      throw new Error("SCRAPE_SOLA:CANNOT_SCRAPE_DATA");
    }
  }

  getBrowser() {
    return this.browser;
  }
}
