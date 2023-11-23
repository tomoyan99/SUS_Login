"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import fs, {writeFileSync} from 'fs';
import {login} from './login.js';
import {reset} from '../lib/utils/reset.js';
import pkg from "../../package.json" assert {type: "json"};
import {hostname} from "os";
import {existChromePath} from "../lib/utils/existChromePath.js";
import {control as cl} from "../lib/utils/control.js";
import {importJSON} from "../lib/utils/importJSON.js";
import {input} from "../lib/utils/input.js";
import {makeSchedule} from "../lib/utils/makeSchedule.js";
import {crypt} from "../lib/crypt.js";
import {today} from "../lib/utils/today.js";
import {pause} from "../lib/utils/pause.js";
import {sleep,writeJSON} from '../lib/utils/myUtils.js';


//main
(async function main() {
    const electron_path = process.argv[2] || "";
    while (true){
        console.clear();
        const version = pkg.version;//バージョン
        const PCname = hostname();//PCのホスト名

        try {

            //login関数に入る
            await login(version,data,sola_link);
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

