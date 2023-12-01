"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import {pause} from "../lib/utils/pause.js";
import fs from "fs";
import {control as cl} from "../lib/utils/control.js";
import setup from "../lib/utils/setup.js";
import {login} from "./login.js";
import {sleep} from "../lib/utils/myUtils.js";

//main
(async function main() {
    // imagesフォルダを作成
    fs.mkdirSync("data/images", { recursive: true });
    // logsフォルダを作成
    fs.mkdirSync("data/logs",{recursive:true});
    // logs.txtを作成
    fs.appendFileSync("data/logs/euc.log","")

    console.log(`${cl.bg_yellow}セットアップ中です・・・・・・${cl.bg_reset}`);
    await sleep(500);
    console.clear();
    while (true){
        try {
            const data = await setup();
            if (!data){
                await pause("exit","[何かキーを押して終了]");
            }
            await login(data);
            break;
        }catch (e) {
            console.clear();
            console.log("[ERROR]");
            console.log(e);
            await pause("pause","[何かキーを押して再起動します]");
        }
    }
})();