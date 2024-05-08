/*
	[makeSchedule関数]
	sclassの学生時間割を参照して、その人が履修している科目の科目コードから、solaの科目ページurlを取得し、sola_link.jsonを作成
*/
import * as puppeteer from "puppeteer-core";
import { today } from "../utils/today";
import { control as cl } from "../utils/control";
import {errorLoop, sleep} from "../utils/myUtils";
import {SolaLinkData, User,SolaClassRecord} from "../main/setup";
import Opener from "./BrowserOpener";
import LaunchOption = Opener.LaunchOption;

type Schedule = { bf:{code:string,name:string}[], af:{code:string,name:string}[]};

export async function createSolaLinkData(user:User,sub_option?:LaunchOption):Promise<SolaLinkData> {
  /* ブラウザの立ち上げ */
  let Scraper = new SolaLinkDataScraper(user);
  const launch_option = {
    is_app:false,
    is_secret:false,
    is_headless:sub_option?.is_headless??true,
  }
  return await errorLoop(4,async()=>{
    Scraper = await Scraper.launch(launch_option);
    try {
      const schedule = await Scraper.searchSclass();
      Scraper.printFunc("続いて、SOLAから科目ページリンクの取得を行います");
      const sola_links:SolaLinkData = await Scraper.searchSola(schedule);
      Scraper.printFunc("履修科目データの登録が完了しました");
      return sola_links
    } catch (e) {
      throw e;
    }finally {
      if (Scraper.getBrowser())await Scraper.close();
    }
  });
}
class SolaLinkDataScraper extends Opener.BrowserOpener {
  constructor(option:User&LaunchOption) {
    super(option);
  }
  async searchSclass():Promise<Schedule> {
    try {
      if (!this.page)throw new Error("PAGE:UNDEFINED");
      await this.open({mode:"SCLASS"});
      const selector = this.selectors.SCHEDULE.SCLASS;
      try {
        const risyuu_div = await this.page.waitForSelector(selector.risyuu_div);
        await risyuu_div?.hover(); //「履修関連」をホバー
        const schedule_link = await this.page.waitForSelector(selector.schedule_link);
        await schedule_link?.click({ delay: 500 }); //授業時間割をクリック
        const term_select = await this.page.waitForSelector(selector.term_select);
        const viewstyle_select = await this.page.waitForSelector(selector.viewstyle_select);
        const search_input = await this.page.waitForSelector(selector.search_input);
        await term_select?.click();//学期選択をクリック
        await term_select?.select("0");//学期の選択：通年
        await viewstyle_select?.click();//表示形式をクリック
        await viewstyle_select?.select("1");//表示形式の選択：一覧表示
        await search_input?.click(); //submitをクリック
        //前期tableの表示を待つ
        const schedule_bf_table = await this.page.waitForSelector(selector.schedule_bf_table);
        //後期tableの表示を待つ
        const schedule_af_table = await this.page.waitForSelector(selector.schedule_af_table);
      }catch (e) {
        throw new Error("SCRAPE_SCLASS:CONTROL_ERROR");
      }
      async function evalSUS(className: string, page: puppeteer.Page) {
        const path_bf = `table#form1\\:standardJugyoTimeSchedule00List td.${className} span`;
        const path_af = `table#form1\\:standardJugyoTimeSchedule01List td.${className} span`;
        const data_bf = await page.$$eval(path_bf, (tds) => {
              return <string[]>tds.map((data) => data.textContent).filter(Boolean);
        });
        const data_af = await page.$$eval(path_af, (tds) => {
          return <string[]>tds.map((data) => data.textContent??"");
        });
        return {
          bf:[...new Set(data_bf)],
          af:[...new Set(data_af)],
        };
      }
      try {
        // //授業コードを取得
        const class_code = await evalSUS("jugyoCd", this.page);
        // //授業名を取得
        const class_name = await evalSUS("jugyoMei", this.page);
        // 授業名から余計な文字を消し去る
        class_name.bf = class_name.bf.map((name)=>name.replace(/ (.*?) .*/g, "$1").replace("\t", ""));
        class_name.af = class_name.af.map((name)=>name.replace(/ (.*?) .*/g, "$1").replace("\t", ""));
        // スケジュールを作成
        const schedule = {
          bf:class_code.bf.map((code,i)=> ({code:code,name:class_name.bf[i]})),
          af:class_code.af.map((code,i)=> ({code:code,name:class_name.af[i]}))
        }
        this.printFunc(cl.fg_green + "履修科目コード及び科目名取得完了" + cl.fg_reset);
        return schedule;
      }catch (e) {
        throw new Error("SCRAPE_SCLASS:CREATE_SCHEDULE_ERROR");
      }
    } catch (e) {
      throw e;
    }
  }

  async searchSola(schedule:Schedule):Promise<SolaLinkData> {
    try {
      if (!this.page)throw new Error("PAGE:UNDEFINED");
      //一回solaを開いておくことでログイン状態を保持
      await this.open({mode:"SOLA"});
      const selector = this.selectors.SCHEDULE.SOLA;
      this.printFunc("前期科目ページURLを取得します・・・");
      await sleep(1000);
      const solaLinkData:SolaLinkData={
        "前期":[],
        "後期":[],
      };
      try {
        //前期科目ページURL取得
        solaLinkData["前期"] = await Promise.all(
            schedule.bf.map(async (t, i:number):Promise<SolaClassRecord> => {
              await sleep(i * 800);
              return<SolaClassRecord>{
                code :t.code,
                name :t.name,
                event:"sola",
                url  :await this.sola_scrp(t)
              }
            })
        );
        this.printFunc(cl.fg_green + "前期科目ページURL取得完了" + cl.fg_reset);
        this.printFunc("後期科目ページを取得します・・・");
        //前期科目ページURL取得
        solaLinkData["後期"] = await Promise.all(
            schedule.af.map(async (t:{code:string,name:string}, i:number):Promise<SolaClassRecord> => {
              await sleep(i * 800);
              return<SolaClassRecord>{
                code :t.code,
                name :t.name,
                event:"sola",
                url  :await this.sola_scrp(t)
              }
            })
        );
        this.printFunc(cl.fg_green + "後期科目ページURL取得完了" + cl.fg_reset);
      }catch (e:any) {
        if (e?.message && e.message === "SCRAPE_SOLA:CANNOT_SCRAPE_DATA"){
          throw e;
        }else{
          throw new Error("SCRAPE_SOLA:DATA_FORMAT_ERROR");
        }
      }
      return solaLinkData;
    } catch (e) {
      throw e;
    }
  }

  private async sola_scrp(data:{code:string,name:string}) {
    //cssを非表示
    if (!this.browser)throw new Error("PAGE:UNDEFINED");
    try{
      const page2 = await this.browser.newPage();
      await this.disableCSS();
      //solaに飛ぶ
      await page2.goto(
          `https://sola.sus.ac.jp/course/search.php?areaids=core_course-course&q=${data.code}`,
          {
            waitUntil: "domcontentloaded",
            timeout: 0,
          },
      );
      await page2.waitForSelector("div.last a.aalink");
      //aのhrefから一番下にあるやつをとってくる
      //URLが存在しなかったらSOLAのページへ
      const url = await page2
          .$eval("div.last a.aalink", (tar) => tar.href)
          .catch(() => "https://sola.sus.ac.jp/");
      //授業名の頭の二文字
      const nend = await page2
          .$eval("div.last a.aalink", (tar) => {
            if (!tar.textContent)return undefined;
            return parseInt(tar.textContent.split("_")[0]);
          })
          .catch(() => {
            return undefined;
          });
      // ページを閉じる
      await page2.close();
      // func(nend + "," + today.getNend());
      if (!nend || nend === today.getNend()) {
        //年度が同じなら
        this.printFunc(url);
        return url;
      } else if (nend !== today.getNend()) {
        //年度が違ったら
        this.printFunc("https://sola.sus.ac.jp/");
        return "https://sola.sus.ac.jp/";
      }
    }catch (e) {
      throw new Error("SCRAPE_SOLA:CANNOT_SCRAPE_DATA");
    }
  }
}