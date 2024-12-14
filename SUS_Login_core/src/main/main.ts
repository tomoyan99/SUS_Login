import {pause} from "../utils/pause";
import fs from "fs";
import {control as cl} from "../utils/control";
import {setup} from "./setup";
import {sleep, writeJSON} from "../utils/myUtils";
import {existChromePath} from "../utils/existChromePath";
import * as pkg from "../../../package.json";
import MainHome from "../blessed/home/MainHome";

//main
export namespace susLoginCore{
  export async function main() {
    process.env.appVersion = pkg.version;
    process.env.infoPath = "data/info.json";
    if (!existChromePath()) {
      console.log(`${cl.fg_red}[ERROR]${cl.fg_reset}`);
      console.log(`${cl.fg_red}chromeがインストールされていません！${cl.fg_reset}`);
      console.log(`${cl.fg_green}C:\\Program Files\\${cl.fg_red}以下などにchromeをインストールしてから再起動してください!${cl.fg_reset}`);
      console.log(`chrome公式ページのURL→ ${cl.fg_cyan}[https://www.google.com/intl/ja_jp/chrome/]${cl.fg_reset}`);
      await pause("exit", "[何かキーを押して終了]");
    }
    // imagesフォルダを作成
    fs.mkdirSync("data/images", { recursive: true });
    // logsフォルダを作成
    fs.mkdirSync("data/logs", { recursive: true });
    // logs.txtを作成
    fs.appendFileSync("data/logs/euc.log", "");
    while (true) {
      try {
        console.clear();
        console.log(`${cl.bg_yellow}セットアップ中です・・・・・・${cl.bg_reset}`,);
        await sleep(400);
        const data = await setup();//データのフェッチ。データが無ければ作成
        console.clear();
        writeJSON("./data/info_raw.json",data,true);
        // if (today.isStartNend(data.last_upd)) {
        //   console.logs(
        //     `${cl.bg_yellow}${cl.fg_black} ※ 年度の切り替わりを検知しました${cl.fg_reset}${cl.bg_reset}`,
        //   );
        //   data = await solaLinkReload(data);
        // }
        const HOME = new MainHome({user:data.userdata,links:data.solaLink});
        break;
      } catch (e) {
        console.clear();
        console.log("[ERROR]");
        console.log("何かしらのエラーが出ました");
        console.log(e);
        await pause("pause", "[何かキーを押して再起動します]");
      }
    }
  }
}