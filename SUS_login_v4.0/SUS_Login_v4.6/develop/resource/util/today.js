"use strict";
/* 
	[today.js]
	日付関連をまとめたモジュール。年度の判定なども行う。
*/

export const today = {
	value:new Date().valueOf(),
	year: new Date().getFullYear(),
	month: new Date().getMonth()+1,
	date: new Date().getDate(),
	hour: new Date().getHours(),
	minute: new Date().getMinutes(),
	sec: new Date().getSeconds(),
	yearl2d: parseInt(new Date().getFullYear()).toString().slice(-2),
	getToday: function getToday() {
		return `${this.year}-${this.month.toString().padStart(2, '0')}-${this.date.toString().padStart(2, '0')}-${this.hour.toString().padStart(2, '0')}-${this.minute.toString().padStart(2, '0')}-${this.sec.toString().padStart(2, '0')}`
	},
	getTodayJP: function getToday() {
		return `${this.year}年${this.month.toString().padStart(2, '0')}月${this.date.toString().padStart(2, '0')}日${this.hour.toString().padStart(2, '0')}時${this.minute.toString().padStart(2, '0')}分${this.sec.toString().padStart(2, '0')}秒`
	},
	getNend : function getNend() {
		let nend = this.year;
		if (1 <= this.month && this.month <=3) {
			nend--;
		} 
		return parseInt(nend.toString().slice(-2));
	},
	//前期か後期か
	whichTerm:function whichTerm() {
		if ( this.month >= 4 && this.month <= 9) {
			return "bf"; //4月から9月の間はbf(前期)
		} else {
			return "af"; //10月から3月の間はaf(後期)
		}
	},
	//学期始まりか否か
	isStartNend: function isStartNend(lastUpdate={year:0,month:0,hour:0,value:0,lastterm:""}){
		const half_year_msec = 2629800000 * 6;
		const newValue = this.value;
		const oldValue = lastUpdate.value;
		//最終更新から6ヶ月以上が過ぎたときや、最終更新のときと学期が違うときに更新
		if (newValue - oldValue >= half_year_msec){
			return true;
		}else return lastUpdate.lastterm !== this.whichTerm();

	}
}