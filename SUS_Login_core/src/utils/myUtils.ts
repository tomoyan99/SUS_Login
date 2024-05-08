import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import * as path from "path";
/* sleep関数 */
export const sleep = (msec: number) =>
  new Promise((resolve) => setTimeout(resolve, msec));

/* writeJSON関数 */
export function writeJSON(filepath: string, data: string | Object,indent:boolean=false) {
  // filepathからディレクトリ部分を抜き出し
  const dirpath = path.dirname(filepath);
  // ディレクトリが無ければ再帰的に作成
  if (existsSync(dirpath))mkdirSync(dirpath,{recursive:true});
  if (typeof data === "string") {
    writeFileSync(filepath, data);
  } else {
    writeFileSync(filepath,(indent)?JSON.stringify(data,null,2):JSON.stringify(data));
  }
}

export function readJSON(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function isNumberInRange(number: number, min: number, max: number) {
  return number >= min && number <= max;
}

export function isObjEmpty(obj: Object) {
  return Object.keys(obj).length === 0;
}

export function replaceNumberWithWord(number: number) {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  // 引数が0から9の範囲内か確認し、対応する文字列に置き換える
  if (number >= 0 && number <= 9) {
    return words[number];
  }
}

// 配列Bに存在しない要素を抽出する
export function getItemsNotIn<T>(arrA: T[], arrB: T[]): T[] {
  return arrA.filter((itemA) => !arrB.includes(itemA));
}
// 指定文字数で文字列を切り詰める
export const truncateString = (str: string, maxLength: number): string =>{
  return str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
}

// コールバックを指定回数再試行する
// それでも無理だったら一番最後の試行のエラーを吐き出す
export async function errorLoop<T>(
    loop_limit: number,
    func:(index:number,loop_limit:number)=>T|Promise<T>,
): Promise<T> {
  let message:Error=new Error("ALL:UNEXPECTED_ERROR");//不明なエラーを初期値に
  for (let count = 1; count <= loop_limit; count++) {
    try {
      // コールバックの実行
      return <T>await func(count,loop_limit);
    } catch (e:unknown) {
      message = (e instanceof Error)?e
          :(typeof e === "string")?new Error(e)
          :message;
    }
  }
  throw message;
}


