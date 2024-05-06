import {control as cl} from "../utils/control.js";
import {createSolaLinkData} from "./createSolaLinkData";
import {writeFileSync} from "fs";
import MyCrypt from "../utils/MyCrypt.js";
import {sleep} from "../utils/myUtils.js";
import {MainData} from "../main/setup";

//初回起動設定
async function solaLinkReload(data: MainData, func = console.log) {
  const info_path = process.env.infoPath;
  if (!info_path) {
    throw "data_file path is undefined";
  }
  const mc = new MyCrypt(info_path);
  const newData: MainData = {};
  if (data.user) {
    newData.user = {
      username: data.user.username,
      password: data.user.password,
    };
  } else {
    throw "userdata is undefined";
  }
  //info.jsonの存在をチェック
  func(`${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`);
  try {
    /* createSolaLinkData関数：solaLinkDataの取得 */
    newData.solaLink = await createSolaLinkData(data, func);

    func("認証ファイルの暗号化を行います・・・");

    // info.jsonの作成or初期化
    writeFileSync(info_path, "");
    await mc.writeCrypt(newData); //info.jsonを暗号化して書き込み
    await sleep(2000);
    func("設定が完了しました。");
    return newData;
  } catch (e) {
    const error_message =
      `${cl.fg_red}[登録エラー]\n` +
      `SOLA科目ページリストの更新に失敗しました。以下の項目を確認してもう一度やり直してください\n` +
      `[考えられる原因]\n` +
      `インターネットに接続されていない\n` +
      `S-ClassまたはSOLAのサーバーが落ちているなどの不具合\n` +
      `${cl.fg_reset}\n`;
    throw e;
  }
}

export default solaLinkReload;