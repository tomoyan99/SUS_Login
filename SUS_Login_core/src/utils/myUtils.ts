import {readFileSync, writeFileSync} from 'fs';
/* sleep関数 */
export const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

/* writeJSON関数 */
export function writeJSON(dir: string, data: (string | Object)) {
    if (typeof data === "string") {
        writeFileSync(dir, data);
    } else {
        writeFileSync(dir, JSON.stringify(data));
    }
}

export function readJSON(path:string) {
    return JSON.parse(readFileSync(path, "utf8"));
}

export function isNumberInRange(number: number, min: number, max: number) {
    return number >= min && number <= max;
}

export function isObjEmpty(obj: Object) {
    return Object.keys(obj).length === 0
}

export function replaceNumberWithWord(number: number) {
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    // 引数が0から9の範囲内か確認し、対応する文字列に置き換える
    if (number >= 0 && number <= 9) {
        return words[number];
    }
}
function getItemsNotIn<T>(arrA: T[], arrB: T[]): T[] {
    // 配列Bに存在しない要素を抽出する
    return arrA.filter(itemA => !arrB.includes(itemA));
}
