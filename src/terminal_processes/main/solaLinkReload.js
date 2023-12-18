import {control as cl} from "../lib/utils/control.js";
import {makeSchedule} from "./makeSchedule.js";
import {writeFileSync} from "fs";
import MyCrypt from "../lib/utils/MyCrypt.js";
import {sleep, writeJSON} from "../lib/utils/myUtils.js";
import {myConfirm} from "../lib/utils/MyPrompt.js";
import {pause} from "../lib/utils/pause.js";

//初回起動設定
async function solaLinkReload(data,func=console.log) {
        const info_path = process.env.infoPath;
        const mc = new MyCrypt(info_path);
        const newData = {
            user:{
                name:data.user.name,
                password:data.user.password
            },
            soraLink:{},
            last_upd:{},
        };
        //info.jsonの存在をチェック
        func(`${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`);
        try {
            /* makeSchedule関数：src/data/sola_link.jsonの作成 */
            newData.solaLink = await makeSchedule(data,func);

            func("認証ファイルの暗号化を行います・・・");

            writeFileSync(info_path,"");
            await mc.writeCrypt(newData);//info.jsonを暗号化して書き込み
            await sleep(2000);
            func("設定が完了しました。");
            return newData;
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