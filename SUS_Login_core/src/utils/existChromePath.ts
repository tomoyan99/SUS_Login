import {join} from "path";
import {existsSync} from "fs";

// 	ローカルにChromeが存在するかを確認して、一つでも存在するならtrueを返す
export function existChromePath(): boolean {
  const suffix = `\\Google\\Chrome\\Application\\chrome.exe`; //chrome.exeまでのサフィックス
  //ローカル依存のプレフィックス
  const prefixes = <string[] | []>(
    [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env["PROGRAMFILES(X86)"],
    ].filter(Boolean)
  ); //空の値を削除
  //ファイルが存在するかを各パスに確認
  if (prefixes && prefixes.length > 0) {
    const existList = prefixes
      .map((prefix) => existsSync(join(prefix, suffix)))
      .filter(Boolean);
    return !!existList.length;
  } else {
    return false;
  }
}