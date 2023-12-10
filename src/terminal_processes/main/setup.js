import {control as cl} from "../lib/utils/control.js";
import {makeSchedule} from "../lib/utils/makeSchedule.js";
import {existsSync,unlinkSync,writeFileSync} from "fs";
import MyCrypt from "../lib/utils/MyCrypt.js";
import {sleep} from "../lib/utils/myUtils.js";
import {MyPrompt} from "../lib/utils/MyPrompt.js";

//初回起動設定
async function setup() {
        const version = process.env.npm_version;
        const info_path = process.env.infoPath;
        const mc = new MyCrypt(info_path);
        const data = {
            user:{
                username:"",
                password:""
            },
            soraLink:{},
            last_upd:{},
        };
        let plane;
        do {
            //info.jsonの存在をチェック
            if (!existsSync(info_path)){
                console.log(`初回起動を確認しました・・・`);
                await sleep(1000);
                console.clear();

                console.log(`${cl.bg_green}SUS_LOGIN_${cl.fg_red}v${version} ${cl.fg_reset}${cl.bg_green}へようこそ！${cl.bg_reset}`);
                console.log(`ユーザー名(学籍番号)とパスワードの設定を行います。`);

                const answers = await MyPrompt.Question({
                    username:{message:"UserName?",name:"UserName",type:"input"},
                    password:{message:"PassWord?",name:"PassWord",type:"password"},
                })
                data.user = {
                    username: answers.username,
                    password: answers.password
                }

                console.log("ユーザー名及びパスワードを登録しました");
                await sleep(1500);

                console.clear();
                /* 履修データの登録 */
                console.log("続いて、履修科目データの登録を行います");
                console.log(`${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`);
                try {
                    /* makeSchedule関数：src/data/sola_link.jsonの作成 */
                    data.solaLink = await makeSchedule(data);

                    console.log("認証ファイルの暗号化を行います・・・");

                    writeFileSync(info_path,"")

                    await mc.writeCrypt(data);//info.jsonを暗号化して書き込み

                    await sleep(2000);
                    console.log("\n設定が完了しました。次回起動時から本機能が使用可能になります。");
                    return false;
                }catch (e){
                    const errormes =
                        `${cl.fg_red}[登録エラー]\n`+
                        `履修科目データの登録に失敗しました。以下の項目を確認してもう一度やり直してください\n`+
                        `[考えられる原因]`+`ユーザー名またはパスワードの入力間違い\n`+
                        `インターネットに接続されていない\n`+
                        `S-ClassまたはSOLAのサーバーが落ちているなどの不具合\n`+
                        `${cl.fg_reset}\n`;
                    throw e;
                }
            }else{
                //info.jsonが存在していたとき
                try {
                    plane = await mc.readPlane();
                    break;
                }catch (e){
                    unlinkSync(info_path);
                    continue;
                }
            }
        }while (true);
        return JSON.parse(plane);
}

export default setup;