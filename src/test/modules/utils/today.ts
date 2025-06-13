import dayjs from "dayjs";
import { LastUpdateData } from "../types/setup";

type Today = {
  value: number;
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
  sec: number;
  getToday(separater?: string): string;
  getTodayJP(): string;
  getNend(): number;
  whichTerm(): "bf" | "af";
  isStartNend(lastUpdate: LastUpdateData): boolean;
};

// dayjsのインスタンスを一度だけ生成して使い回すことで、全プロパティの時刻を統一
const now = dayjs();

export const today: Today = {
  value: now.valueOf(),
  year: now.year(),
  month: now.month() + 1, // monthは0から始まるため+1
  date: now.date(),
  hour: now.hour(),
  minute: now.minute(),
  sec: now.second(),

  getToday: function (separater: string = "-"): string {
    return now.format(`YYYY${separater}MM${separater}DD${separater}HH${separater}mm${separater}ss`);
  },

  getTodayJP: function (): string {
    return now.format("YYYY年MM月DD日HH時mm分ss秒");
  },

  getNend: function (): number {
    // 1月〜3月の場合は前年度とする
    const nendYear = this.month >= 1 && this.month <= 3 ? this.year - 1 : this.year;
    return parseInt(nendYear.toString().slice(-2));
  },

  whichTerm: function (): "bf" | "af" {
    // 4月〜9月は前期(bf)、10月〜3月は後期(af)
    return this.month >= 4 && this.month <= 9 ? "bf" : "af";
  },

  isStartNend: function (lastUpdate: LastUpdateData): boolean {
    // 半年分のミリ秒 (おおよその値)
    const HALF_YEAR_MSEC = 6 * 30 * 24 * 60 * 60 * 1000;
    const newValue = this.value;
    const oldValue = lastUpdate.value;

    // 最終更新から半年以上経過しているか、学期が変わっていれば true
    if (newValue - oldValue >= HALF_YEAR_MSEC) {
      return true;
    }
    return lastUpdate.term !== this.whichTerm();
  },
};
