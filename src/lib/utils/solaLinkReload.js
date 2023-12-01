import {control as cl} from "./control.js";
import {makeSchedule} from "./makeSchedule.js";
import {writeFileSync} from "fs";
import MyCrypt from "./MyCrypt.js";
import {sleep} from "./myUtils.js";

//初回起動設定
async function solaLinkReload(data) {
        const version = process.env.npm_package_version;
        const info_path = process.env.infoPath;
        const mc = new MyCrypt(info_path);
        let plane;
        //info.jsonの存在をチェック
        console.log(`SOLA科目ページリストを更新します`);
        console.log(`${cl.fg_yellow}※ 科目リストの更新には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい${cl.fg_reset}`);
        try {
            /* makeSchedule関数：src/data/sola_link.jsonの作成 */
            data.solaLink = await makeSchedule(data);

            console.log("認証ファイルの暗号化を行います・・・");

            writeFileSync(info_path,"");
            await mc.writeCrypt(data);//info.jsonを暗号化して書き込み
            await sleep(2000);
            console.log("設定が完了しました。");
            return data;
        }catch (e){
            const errormes =
                `${cl.fg_red}[登録エラー]\n`+
                `SOLA科目ページリストの更新に失敗しました。以下の項目を確認してもう一度やり直してください\n`+
                `[考えられる原因]\n`+
                `インターネットに接続されていない\n`+
                `S-ClassまたはSOLAのサーバーが落ちているなどの不具合\n`+
                `${cl.fg_reset}\n`;
            throw e;
        }
}

export default solaLinkReload;