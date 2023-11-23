import {reset} from "../lib/utils/reset.js"
import fs from "fs";
async function preSetup() {
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
}