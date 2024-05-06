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
    throw e;
  }
}

export default solaLinkReload;