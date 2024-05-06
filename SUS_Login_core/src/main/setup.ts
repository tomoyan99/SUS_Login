import { control as cl } from "../utils/control";
import { createSolaLinkData } from "../puppeteer/createSolaLinkData";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import MyCrypt from "../utils/MyCrypt";
import { sleep } from "../utils/myUtils";
import { MyPrompt } from "../utils/MyPrompt";
import { pause } from "../utils/pause";

export type MainData = Partial<{
  user: {
    username: string;
    password: string;
  };
  solaLink: SolaLinkData;
  last_upd: LastUpdateData;
}>;
export type SolaClassRecord = {
  name: string;
  event: "sola";
  code: string;
  url: string;
};
export type SolaLinkData = {
  前期: Record<string, SolaClassRecord>;
  後期: Record<string, SolaClassRecord>;
};
export type LastUpdateData = {
  year: number;
  month: number;
  date: number;
  value: number;
  nowterm: "bf" | "af";
};

//初回起動設定
export async function setup() {
  const info_path = process.env.infoPath;
  const version = process.env.appVersion;
  if (!info_path || !version) {
    throw "'infoPath' or 'version' is Empty";
  }
  // 暗号コントローラーを生成
  const mc = new MyCrypt(info_path);
  // メインデータ定義
  const data: MainData = {};
  let plane;
  do {
    //info.jsonの存在をチェック
    if (!existsSync(info_path)) {
      // 存在していなかったら新たに作成
      data.solaLink = await wizardProcess(data, version);
      break;
    } else {
      try {
        //info.jsonが存在していたとき
        //復号してデータの読み込み
        plane = await mc.readPlane();
        return JSON.parse(plane);
      } catch (e) {
        //info.jsonが読み込めなかったinfo.jsonを消去して登録を最初から
        console.log(`${cl.error}[読み込みエラー]${cl.reset}`);
        console.log("データファイルが読み込めませんでした");
        console.log(
          "ファイルが破損している可能性があるため、データの初期化と再登録を行います",
        );
        unlinkSync(info_path);
        await pause("pause");
      }
    }
  } while (true);
  console.log("認証ファイルの暗号化を行います・・・");
  // ファイルの作成
  writeFileSync(info_path, "");
  await mc.writeCrypt(data); //info.jsonを暗号化して書き込み
  await sleep(2000);
  console.log(
    "\n設定が完了しました。次回起動時から本機能が使用可能になります。",
  );
  return false;
}

async function wizardProcess(
  data: MainData,
  version: string,
): Promise<SolaLinkData> {
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
  data.user = {
    username: username.result,
    password: password.result,
  };
  console.log("ユーザー名及びパスワードを登録しました");
  await sleep(1500);
  /*データ取得とエラーループ*/
  const retryMax = 4;
  retry_loop: while (true) {
    error_loop: for (let i = 1; i <= retryMax; i++) {
      const result = await getDataProcess(data, i, retryMax);
      if (result === "CONTINUE:ERROR_LOOP") {
        continue;
      }
      if (result === "CONTINUE:RETRY_LOOP") {
        continue retry_loop;
      }
      return result;
    }
  }
}

type RetryMessage = "CONTINUE:RETRY_LOOP" | "CONTINUE:ERROR_LOOP";

async function getDataProcess(
  data: MainData,
  count: number,
  countMax: number,
): Promise<SolaLinkData | RetryMessage> {
  try {
    console.clear();
    /* 履修データの登録 */
    console.log("履修科目データを取得します");
    console.log(
      `${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`,
    );
    /* makeSchedule関数*/
    return await createSolaLinkData(data);
  } catch (e) {
    console.clear();
    if (count < countMax) {
      console.log(
        `[ERROR] 試行回数:${count}\n履修科目データの取得に失敗しました。3秒後に再試行します`,
      );
      await sleep(3000);
      return "CONTINUE:ERROR_LOOP";
    } else {
      console.log(
        `[ERROR] 4回試行しましたが失敗しました。\n再試行するか、このまま終了するか選択してください`,
      );
      // 再入力の確認[y/nの選択]
      const yn: MyPrompt.Answer<boolean> = await MyPrompt.question({
        message: "再試行しますか？",
        type: "confirm",
      });
      if (yn.result) {
        console.log("[YES]が選択されました。3秒後に再試行します");
        await sleep(3000);
        return "CONTINUE:RETRY_LOOP";
      } else {
        console.log("[NO]が選択されました。終了します");
        await pause("exit", "[何かキーを押して終了]");
        throw "exit";
      }
    }
  }
}