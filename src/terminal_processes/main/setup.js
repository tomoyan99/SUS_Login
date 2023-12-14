import {control as cl} from "../lib/utils/control.js";
import {makeSchedule} from "./makeSchedule.js";
import {existsSync,unlinkSync,writeFileSync} from "fs";
import MyCrypt from "../lib/utils/MyCrypt.js";
import {sleep} from "../lib/utils/myUtils.js";
import {myConfirm, MyPrompt} from "../lib/utils/MyPrompt.js";
import {pause} from "../lib/utils/pause.js";

//初回起動設定
async function setup() {
        const info_path = process.env.infoPath;
        const version = process.env.appVersion;
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
                console.clear();
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
                let schedule_try_count = 1;
                do {
                    try {
                        console.clear();
                        /* 履修データの登録 */
                        console.log("履修科目データを取得します");
                        console.log(`${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`);
                        /* makeSchedule関数：src/data/sola_link.jsonの作成 */
                        data.solaLink = await makeSchedule(data);
                        break;
                    }catch (e) {
                        console.clear();
                        if (schedule_try_count < 4){
                            console.log(`[ERROR] 試行回数:${schedule_try_count}\n履修科目データの取得に失敗しました。3秒後に再試行します`);
                            await sleep(3000);
                            continue;
                        }else{
                            console.log(`[ERROR] 4回試行しましたが失敗しました。\n再試行するか、このまま終了するか選択してください`);
                            const yn = await myConfirm({message: "再試行しますか？",name: "retry"});
                            if (yn){
                                console.log("[YES]が選択されました。3秒後に再試行します");
                                await sleep(3000);
                                schedule_try_count = 1;
                                continue;
                            }else{
                                console.log("[NO]が選択されました。終了します");
                                await pause("exit","[何かキーを押して終了]");
                                //process.exit
                            }
                        }
                    }
                }while (true);
                console.log("認証ファイルの暗号化を行います・・・");

                writeFileSync(info_path,"");
                await mc.writeCrypt(data);//info.jsonを暗号化して書き込み
                await sleep(2000);
                console.log("\n設定が完了しました。次回起動時から本機能が使用可能になります。");
                return false;
            }else{
                try {
                    //info.jsonが存在していたとき
                    //復号してデータの読み込み
                    plane = await mc.readPlane();
                    break;
                }catch (e){
                    //info.jsonが読み込めなかったら登録を最初から
                    unlinkSync(info_path);
                    continue;
                }
            }
        }while (true);
        return JSON.parse(plane);
}

export default setup;