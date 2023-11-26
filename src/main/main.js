"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import pkg from "../../package.json" assert {type: "json"};
import {pause} from "../lib/utils/pause.js";
import * as pie from "puppeteer-in-electron";
import puppeteer from "puppeteer";
import * as electron from "electron";

//main
(async function main() {
    await pie.initialize(electron.app);
    do {
        console.clear();
        const version = pkg.version;//バージョン
        try {

            break;
        } catch (e) {
            console.clear();
            console.log("[ERROR]")
            console.log(e);
            await pause("pass","[何かキーを押して再起動します]");
        }
    }while (true);
    await pause("exit","[何かキーを押して終了します]");
})();

