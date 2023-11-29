"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import {pause} from "../lib/utils/pause.js";
import fs, {readFileSync} from "fs";
import {control as cl} from "../lib/utils/control.js";
import inputNamePass from "../lib/utils/inputNamePass.js";
import {login} from "./login.js";
import {sleep} from "../lib/utils/myUtils.js";

const pkg = JSON.parse(readFileSync("./package.json","utf8"));
//main
(async function main() {
    process.env.APPversion = pkg.version;
    // imagesフォルダを作成
    fs.mkdirSync("data/images", { recursive: true });
    // logsフォルダを作成
    fs.mkdirSync("data/logs",{recursive:true});
    console.log(`${cl.bg_yellow}セットアップ中です・・・・・・${cl.bg_reset}`);
    await sleep(1000);
    console.clear();
    while (true){
        try {
            const data = await inputNamePass();
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