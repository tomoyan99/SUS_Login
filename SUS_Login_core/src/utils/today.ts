"use strict";
/* 
	[today.js]
	日付関連をまとめたモジュール。年度の判定なども行う。
*/

import {LastUpdateData} from "../main/setup";

type Today = {
  value: number;
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
  sec: number;
  yearl2d: number; //年の下二桁
  getToday(): string; //YYYY-MM-DD-hh-mm-ss
  getTodayJP(): string; //YYYY年MM月DD日hh時mm分ss秒
  getNend(): number;
  whichTerm(): "bf" | "af";
  isStartNend(lastUpdate: LastUpdateData): boolean;
};
export const today: Today = {
  value   : new Date().valueOf(),
  year    : new Date().getFullYear(),
  month   : new Date().getMonth() + 1,
  date    : new Date().getDate(),
  hour    : new Date().getHours(),//0~23
  minute  : new Date().getMinutes(),
  sec     : new Date().getSeconds(),
  yearl2d : parseInt(new Date().getFullYear().toString().slice(-2)),
  getToday: function getToday(separater:string="-") {
    return `${this.year}${separater}`+
           `${this.month.toString().padStart(2, "0")}${separater}`+
           `${this.date.toString().padStart(2, "0")}${separater}`+
           `${this.hour.toString().padStart(2, "0")}${separater}`+
           `${this.minute.toString().padStart(2, "0")}`+
           `${separater}${this.sec.toString().padStart(2, "0")}`;
  },
  getTodayJP: function getToday() {
    return `${this.year}年`+
           `${this.month.toString().padStart(2, "0")}月`+
           `${this.date.toString().padStart(2, "0")}日`+
           `${this.hour.toString().padStart(2, "0")}時`+
           `${this.minute.toString().padStart(2, "0")}分`+
           `${this.sec.toString().padStart(2, "0")}秒`;
  },
  getNend: function getNend() {
    let nend = this.year;
    if (1 <= this.month && this.month <= 3) {
      nend--;
    }
    return parseInt(nend.toString().slice(-2));
  },
  //前期か後期か
  whichTerm: function whichTerm() {
    if (this.month >= 4 && this.month <= 9) {
      return "bf"; //4月から9月の間はbf(前期)
    } else {
      return "af"; //10月から3月の間はaf(後期)
    }
  },
  //学期始まりか否か
  isStartNend: function isStartNend(lastUpdate:LastUpdateData) {
    // 半年分の秒数
    const half_year_msec = 2629800000 * 6;
    const newValue = this.value;
    const oldValue = lastUpdate.value;
    //最終更新から6ヶ月以上が過ぎたときや、最終更新のときと学期が違うときに年度が切り替わったとみなす
    if (newValue - oldValue >= half_year_msec) {
      return true;
    } else {
      return lastUpdate.term !== this.whichTerm();
    }
  },
};