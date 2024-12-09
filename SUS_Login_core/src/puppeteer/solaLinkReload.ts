import {control as cl} from "../utils/control.js";
import {createSolaLinkData} from "./createSolaLinkData";
import {writeFileSync} from "fs";
import MyCrypt from "../utils/MyCrypt.js";
import {sleep} from "../utils/myUtils.js";
import {MainData, User} from "../main/setup";

//初回起動設定
async function solaLinkReload(userData:User, func = console.log) {
  const info_path = process.env.infoPath;
  if (!info_path) {
    throw "data_file path is undefined";
  }
  const mc = new MyCrypt(info_path);
  let new_data: Partial<MainData>={};
  if (userData) {
    new_data.userdata = {
      username: userData.username,
      password: userData.password,
    };
  } else {
    throw "userData is undefined";
  }
  //info.jsonの存在をチェック
  func(`${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`);
  try {
    /* createSolaLinkData関数：solaLinkDataの取得 */
    new_data.solaLink = await createSolaLinkData(userData,{printFunc:func});
    new_data = <MainData>new_data;
    func("認証ファイルの暗号化を行います・・・");
    // info.jsonの作成or初期化
    writeFileSync(info_path, "");
    await mc.writeCrypt(new_data); //info.jsonを暗号化して書き込み
    await sleep(2000);
    func("設定が完了しました。");
    return <MainData>new_data;
  } catch (e) {
    throw e;
  }
}

export default solaLinkReload;