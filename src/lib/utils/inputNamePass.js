import {control as cl} from "./control.js";
import {makeSchedule} from "./makeSchedule.js";
import {existsSync,unlinkSync,writeFileSync} from "fs";
import MyCrypt from "./MyCrypt.js";
import {sleep} from "./myUtils.js";
import {input, password} from '@inquirer/prompts';

//初回起動設定
async function inputNamePass() {
    return new Promise(async(resolve, reject)=>{
        const version = process.env.APPversion;
        const info_path = process.env.infoPath;
        const mc = new MyCrypt(info_path);
        const data = {
            user:{
                name:"",
                password:""
            },
            main:{},
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
                //学籍番号の入力
                const NAME = await input({ message: "UserName?>" });

                //パスワードの入力。二回入力させて間違っていれば再入力
                do {
                    try {
                        const PAWO1 = await password({ message: "PassWord?>" ,mask:true});
                        console.log("確認のためもう一度パスワードを入力してください");
                        const PAWO2 = await password({ message: "PassWord?>" ,mask:true});
                        if (PAWO1 === PAWO2) {
                            data.user.name = NAME; //usernameの追加
                            data.user.password = PAWO1; //passwordの追加
                            break;
                        } else {
                            console.log("パスワードが一致しません。もう一度入力してください");
                            await sleep(1000);
                        }
                    }catch (e){
                        reject(`${cl.fg_red}[登録エラー] ユーザー名及びパスワードの登録に失敗しました。もう一度再起動してください${cl.fg_reset}`);
                    }
                }while (true);

                console.log("ユーザー名及びパスワードを登録しました");
                await sleep(1500);

                console.clear();

                data.main ={
                    "SUS_LOGIN":{
                        "{#00ff4c-fg}EUC{/}":{
                            event:"euc"
                        },
                        "SCLASS":{
                            event:"sclass"
                        },
                        "SOLA":{
                            event:"sola",
                            "{#0077ff-fg}PAGE_LIST{/}":{event:"page"}
                        },
                        "履修仮組みツール":{event:"completion"}
                    },
                    "LOG":{event:"log"},
                    "IMAGE":{event:"image"},
                    "{red-fg}QUIT{/}":{event:"quit"},
                }

                /* 履修データの登録 */
                console.log("続いて、履修科目データの登録を行います");
                console.log(`${cl.fg_yellow}※ 科目データの登録には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい${cl.fg_reset}`);
                try {
                    /* makeSchedule関数：src/data/sola_link.jsonの作成 */
                    data.solaLink = await makeSchedule(data);

                    console.log("認証ファイルの暗号化を行います・・・");

                    writeFileSync(info_path,"")

                    await mc.writeCrypt(data);//info.jsonを暗号化して書き込み

                    await sleep(2000);
                    console.log("\n設定が完了しました。次回起動時から本機能が使用可能になります。");
                    resolve(false);
                }catch (e){
                    const errormes =
                        `${cl.fg_red}[登録エラー]\n`+
                        `履修科目データの登録に失敗しました。以下の項目を確認してもう一度やり直してください\n`+
                        `[考えられる原因]`+`ユーザー名またはパスワードの入力間違い\n`+
                        `インターネットに接続されていない\n`+
                        `S-ClassまたはSOLAのサーバーが落ちているなどの不具合\n`+
                        `${cl.fg_reset}\n`;
                    reject(e);
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
        resolve(JSON.parse(plane));
    });
}

export default inputNamePass;