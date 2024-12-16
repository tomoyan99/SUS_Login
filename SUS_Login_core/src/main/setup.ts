import {control as cl} from "../utils/control";
import {createSolaLinkData} from "../puppeteer/createSolaLinkData";
import {existsSync, unlinkSync, writeFileSync} from "fs";
import MyCrypt from "../utils/MyCrypt";
import {errorLoop, sleep} from "../utils/myUtils";
import {MyPrompt} from "../utils/MyPrompt";
import {pause} from "../utils/pause";
import {today} from "../utils/today";

export type MainData = {
  userdata: User;
  solaLink: SolaLinkData;
  last_upd: LastUpdateData;
};
export type User = {
  username: string;
  password: string;
};
export type EventName = "appinfo"|"euc"|"sclass"|"sola"|"page"|"pagereload"|"log"|"image"|"quit"|string;
export type TreeEventMap = {
  event?:EventName;
  [key:string]:TreeEventMap|string|undefined;
};
export type SolaClassRecord = TreeEventMap&{
  name: string;
  view_name?: string;
  event: "sola";
  code: string;
  url: string;
};
export type SolaLinkData = Record<"前期"|"後期"|string,SolaClassRecord[]|TreeEventMap>;

export type LastUpdateData = {
  year: number;
  month: number;
  date: number;
  value: number;
  term: "bf" | "af";
};

//初回起動設定
export async function setup():Promise<MainData> {
  const info_path = process.env.infoPath;
  const version = process.env.appVersion;
  if (!info_path || !version) {
    throw new Error("SETUP:ENV_VALUE_IS_EMPTY");
  }
  // 暗号コントローラーを生成
  const mc = new MyCrypt(info_path);
  let data:MainData;
  // メインデータ定義
  let plane;
  //info.jsonの存在をチェック
  if (!existsSync(info_path)) {
    // 存在していなかったら初期設定を行う
    data = await wizardProcess(version);
  } else {
    try {
      //info.jsonが存在していたとき
      //復号してデータの読み込み
      plane = await mc.readPlane();
      return <MainData>JSON.parse(plane);
    } catch (e) {
      //info.jsonが読み込めなかったらinfo.jsonを消去して初期設定を最初から
      console.log(`${cl.error}[読み込みエラー]${cl.reset}`);
      console.log("データファイルが読み込めませんでした");
      console.log("ファイルが破損している可能性があるため、データの初期化と再登録を行います");
      // info.jsonの消去
      unlinkSync(info_path);
      await pause("pause");
      // 初期設定
      data = await wizardProcess(version);
    }
  }
  console.log("認証ファイルの暗号化を行います・・・");
  // ファイルの作成
  await mc.writeCrypt(data); //info.jsonを暗号化して書き込み
  await sleep(2000);
  // console.log("\n設定が完了しました。次回起動時から本機能が使用可能になります。");
  return data;
}

// 対話式にユーザーデータの取得とかを行うやつ
async function wizardProcess(version: string): Promise<MainData> {
  console.clear();
  console.log(`初回起動を確認しました・・・`);
  await sleep(1000);
  console.clear();
  console.log(
    `${cl.bg_green}SUS_LOGIN_${cl.fg_red}v${version} ${cl.fg_reset}${cl.bg_green}へようこそ！${cl.bg_reset}`,
  );
  console.log(`ユーザー名(学籍番号)とパスワードの設定を行います。`);
  // 学籍番号とパスワードの入力
  const username: MyPrompt.Answer<string> = await MyPrompt.question({
    message: "UserName?",
    type: "input",
  });
  const password: MyPrompt.Answer<string> = await MyPrompt.question({
    message: "PassWord?",
    type: "password",
  });
  const userdata = {
    username: username.result,
    password: password.result,
  };
  const last_upd = {
    year: today.year,
    month: today.month,
    date: today.date,
    value: today.value,
    term: today.whichTerm(),
  };
  console.log("ユーザー名及びパスワードを登録しました");
  await sleep(1500);
  /*データ取得とエラーループ*/
  while(true){
    try{
      return await errorLoop(4,async(count, loop_limit)=>{
        try {
          // solaLinkDataのスクレイピング
          const solaLinkData= await getDataProcess(userdata, count, loop_limit);
          return <MainData>{
            userdata:userdata,
            solaLink:solaLinkData,
            last_upd:last_upd
          };
        }catch (e:any) {
          throw e;
        }
      });
    }catch (e:any) {
      // EXITと謎エラーなら終了。SETUP:CONTINUE_OUTER_LOOPならerrorLoopごと再試行
      if (e.message === "SETUP:CONTINUE_OUTER_LOOP")continue;
      if (e.message === "SETUP:EXIT")await pause("exit","[何かキーを押して終了]");
      throw new Error("ALL:UNREACHABLE_HERE");
    }
  }
}
// sclass,solaからsolaリンクデータを取ってくるやつ
async function getDataProcess(
    userdata:User,
    count: number,
    loop_limit: number,
): Promise<SolaLinkData> {
    console.clear();
    /* 履修データの登録 */
    console.log("履修科目データを取得します");
    console.log(
      `${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`,
    );
    /* solaLinkDataを作る*/
  try {
    return await createSolaLinkData(userdata);
  }catch (e) {
    // エラーでsolaLinkDataが作れなかった場合
    console.clear();
    if (count < loop_limit) {
      console.log(`[ERROR] 試行回数:${count}\n履修科目データの取得に失敗しました。3秒後に再試行します`);
      await sleep(3000);
      throw new Error("SETUP:CONTINUE_INNER_LOOP");// innerループ再試行エラー
    } else {
      console.log(`[ERROR] ${count}回試行しましたが失敗しました。\n再試行するか、このまま終了するか選択してください`);
      // 再入力の確認[y/nの選択]
      const yn: MyPrompt.Answer<boolean> = await MyPrompt.question({
        message: "再試行しますか？",
        type: "confirm",
      });
      if (yn.result) {
        console.log("[YES]が選択されました。3秒後に再試行します");
        await sleep(3000);
        throw "SETUP:CONTINUE_OUTER_LOOP";// OUTERループ再試行エラー
      } else {
        console.log("[NO]が選択されました。終了します");
        throw "SETUP:EXIT"; //終了エラー
      }
    }
  }
}