"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import {pause} from "../lib/utils/pause.js";
import fs from "fs";
import {control as cl} from "../lib/utils/control.js";
import setup from "./setup.js";
import {sleep} from "../lib/utils/myUtils.js";
import MainHome from "./MainHome.js";
import {today} from "../lib/utils/today.js";
import solaLinkReload from "../lib/utils/solaLinkReload.js";

//main
(async function main() {
    // imagesフォルダを作成
    fs.mkdirSync("data/images", { recursive: true });
    // logsフォルダを作成
    fs.mkdirSync("data/logs",{recursive:true});
    // logs.txtを作成
    fs.appendFileSync("data/logs/euc.log","");
    while (true){
        try {
            console.clear();
            console.log(`${cl.bg_yellow}セットアップ中です・・・・・・${cl.bg_reset}`);
            await sleep(600);
            console.clear();
            let data = await setup();
            if (!data){
                await pause("exit","[何かキーを押して終了]");
            }
            if (today.isStartNend(data.last_upd)){
                console.log(`${cl.bg_yellow}${cl.fg_black} ※ 年度の切り替わりを検知しました${cl.fg_reset}${cl.bg_reset}`)
                data = await solaLinkReload(data);
            }
            console.clear();
            new MainHome([data.user,data.solaLink]);
            break;
        }catch (e) {
            console.clear();
            console.log("[ERROR]");
            console.log("何かしらのエラーが出ました");
            await pause("pause","[何かキーを押して再起動します]");
        }
    }
})();