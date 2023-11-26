"use strict";
/*
	[electron_boot.cjs]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import pkg from "../../package.json" assert {type: "json"};
import {pause} from "../lib/utils/pause.js";
import inputNamePass from "../lib/utils/inputNamePass.cjs";


//main
(async function main() {


    while (true){
        console.clear();
        const version = pkg.version;//バージョン

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

