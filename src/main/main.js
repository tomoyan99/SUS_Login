"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import pkg from "../../package.json" assert {type: "json"};
import {pause} from "../lib/utils/pause.js";
import inputNamePass from "../lib/utils/inputNamePass.js";
import fs from "fs";
import {control as cl} from "../lib/utils/control.js";


//main
(async function main() {
    process.env.APPversion = pkg.version;
    // imagesフォルダを作成
    fs.mkdirSync("data/images", { recursive: true });
    // logsフォルダを作成
    fs.mkdirSync("data/logs",{recursive:true});
    console.log(`${cl.bg_yellow}セットアップ中です・・・・・・${cl.bg_reset}`);
    while (true){
        console.clear();
        try {
            const data = await inputNamePass();
            if (!data){break;}
            //login関数に入る
            // await login(version,data);
            break;
        } catch (e) {
            console.clear();
            console.log("[ERROR]")
            console.log(e);
            await pause("pass","[何かキーを押して再起動します]");
        }
    }
    await pause("exit","[何かキーを押して終了します]");
})();

