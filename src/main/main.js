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
            // src または src/dataフォルダがあるか判定。なければ作成
            if (!fs.existsSync("./src") || !fs.existsSync("./src/data")) {
                fs.mkdirSync("src/data", { recursive: true });
            }
            //info.jsonがあるか判定。なければ作成
            if (!fs.existsSync("./src/data/info.json")) {
                await reset("./src/data/info.json");
            }
            // imagesフォルダがあるか判定。なければ作成
            if (!fs.existsSync(".src/images")) {
                fs.mkdirSync("./images");
            }
            // logsフォルダがあるか判定。なければ作成
            if (!fs.existsSync(".src/logs")) {
                fs.mkdirSync("./src/logs");
                fs.writeFileSync("./src/logs/euc.log", "");
            }
            console.log(`${cl.bg_yellow}セットアップ中です・・・・・・${cl.bg_reset}`);
            const data = await input_name_and_pass(version,PCname);//初回起動なら学籍番号とパスワードを入力 info.jsonの中身をdataに格納
            //初回起動のときはdataは1を返すので、dataが1のとき終了
            if (data === 1){
                await pause("exit","[何かキーを押して終了します]");
            }
            //sola_link.jsonがなかったら再生成
            if (!fs.existsSync("./src/data/sola_link.json")){
                const sola_link = await makeSchedule(data).catch(async() => {
                    console.log(`${cl.fg_red}[登録エラー] 履修科目データの登録に失敗しました。パスワードなどが正しいか確認してもう一度やり直してください${cl.fg_reset}`);
                    await pause("exit","[何かキーを押して終了します]");
                });
                writeJSON("src/data/sola_link.json", await crypt.encrypt(sola_link));//sola_link.jsonの暗号化
            }

            const sola_link = await crypt.decrypt("src/data/sola_link.json");//info.jsonの中身を復号して変換

            /* 前期後期の入れ替わり(4月と10月)にsola_link.jsonの更新 */
            if (today.isStartNend(data.last_upd) === true) {
                console.clear();
                console.log("期を跨いだので履修科目データの更新を行います");
                await sleep(1500);
                console.log(`${cl.fg_yellow}※ 科目データの更新には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい${cl.fg_reset}`);
                try {
                    const sola_link = await makeSchedule(data);
                    writeJSON("src/data/info.json", await crypt.encrypt(data));//info.jsonを暗号化して書き込み
                    writeJSON("src/data/sola_link.json", await crypt.encrypt(sola_link));//info.jsonを暗号化して書き込み
                }catch (e){
                    throw new Error(`${cl.fg_red}\n科目データの更新に失敗しました。${cl.fg_reset}\nネットワークの接続状況を確認して、再実行してください。それでも失敗するようでしたら、${cl.fg_cyan}infoClear.exe${cl.fg_reset}を実行して初期化ののちもう一度最初から登録を行ってください。\n`);
                }
            }
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

//初回起動設定
async function input_name_and_pass(version,PCname) {

    //chromeがインストールされているかの判定
    if (!existChromePath().length) {
        console.log(`${cl.fg_red}[ERROR]${cl.fg_reset}`);
        console.log(`${cl.fg_red}chromeがインストールされていません！${cl.fg_reset}`);
        console.log(`${cl.fg_green}C:\\Program Files\\${cl.fg_red}以下などにchromeをインストールしてから再起動してください!${cl.fg_reset}`);
        console.log(`chrome公式ページのURL→${cl.fg_cyan}[https://www.google.com/intl/ja_jp/chrome/]${cl.fg_reset}`);
        throw "Chrome install error";
    }
    try {
        //info.jsonが暗号化されていなければ取り込める
        let data_can_write = importJSON(`resource/data/info.json`);
        console.log(`初回起動を確認しました・・・`);
        await sleep(1000);
        console.clear();
        console.log(`OpenSUS_v${version} へようこそ！`);
        console.log(`ユーザー名(学籍番号)とパスワードの設定を行います。`);
        //学籍番号の入力
        const NAME = await input("UserName?>", false);
        //パスワードの入力。二回入力させて間違っていれば再入力
        do {
            try {
                const PAWO1 = await input("PassWord?>", true);
                console.log("確認のためもう一度パスワードを入力してください");
                const PAWO2 = await input("PassWord?>", true);
                if (PAWO1 === PAWO2) {
                    data_can_write.username = NAME; //usernameの追加
                    data_can_write.password = PAWO1; //passwordの追加
                    break;
                } else {
                    console.log("パスワードが一致しません。もう一度入力してください");
                    await sleep(1000);
                }
            }catch (e){
                console.log(`${cl.fg_red}[登録エラー] ユーザー名及びパスワードの登録に失敗しました。もう一度再起動してください${cl.fg_reset}`);
                process.exit();
            }
        }while (true);

        console.log("ユーザー名及びパスワードを登録しました");
        await sleep(1500);

        console.clear();

        /* 履修データの登録 */
        console.log("続いて、履修科目データの登録を行います");
        console.log(`${cl.fg_yellow}※ 科目データの登録には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい${cl.fg_reset}`);
        /* makeSchedule関数：src/data/sola_link.jsonの作成 */
        try {
            const sola_link = await makeSchedule(data_can_write);
            console.log("認証ファイルの暗号化を行います・・・");
            writeJSON("src/data/info.json", await crypt.encrypt(data_can_write));//info.jsonを暗号化して書き込み
            writeJSON("src/data/sola_link.json", await crypt.encrypt(sola_link));//sola_link.jsonの暗号化
            await sleep(2000);
            console.log("\n設定が完了しました。次回起動時から本機能が使用可能になります。");
        }catch (e){
            console.log(`${cl.fg_red}[登録エラー] 履修科目データの登録に失敗しました。以下の項目を確認してもう一度やり直してください
            [考えられる原因]
            ・ユーザー名またはパスワードの入力間違い
            ・インターネットに接続されていない
            ・S-ClassまたはSOLAのサーバーが落ちているなどの不具合
            ${cl.fg_reset}`);
            await pause("exit","[何かキーを押して終了します]");
        }
        return 1;
    } catch (e) {
        //info.jsonがすでに暗号化されていてjsonとして取り込めなかったとき
        return await crypt.decrypt('src/data/info.json', PCname);//info.jsonの中身を復号して変換
    }
}