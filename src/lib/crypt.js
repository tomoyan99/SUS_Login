"use strict";
/* 
	[crypt.js]
	info.jsonの中身を暗号化および復号する
 */

//cryptオブジェクトをエクスポート
import {readFileSync} from "fs";
import {hostname} from "os";

export const crypt = {
	key : hostname(),
	//文字列を1文字ずつ文字コードにして足し算
	async strToDec(str) {
		let codesum = 0x0;
		for (let i = 0; i < str.length; i++) {
			const charcode = str.slice(i, i + 1).charCodeAt(0) ;
			codesum += charcode;
		}
		return codesum;
	},
	//暗号化
	async encrypt(data) {
		const hirabun = JSON.stringify(data);
		const dec = await this.strToDec(this.key);
		let str = [];
		str[0] = hirabun; //平文
		let i, n;
		let y = 0;
		let x = dec;
		//繰り返し回数をざっくり計算
		for (n = 1; y < 4000000; n++) {
			y = x * 2 * String(n).length
			x = y;
		}
		// const dec2 = parseInt(dec / 35); //繰り返し回数
		const dec2 = n - 1;//繰り返し回数
		for (i = 0; i < dec2; i++) {
			str[i + 1] = "";
			for (let j = 0; j < str[i].length; j++) {
				const hiracode = str[i].charCodeAt(j) ^ (dec + i);//文字列を1文字ずつコードと排他的論理和
				const angou = String.fromCharCode(hiracode); //hiracodeを文字化
				// const angou = hiracode;
				str[i + 1] += angou + i;//暗号化文字にiの値を付け加えて増量
				// console.log(i);
			}
		}
		try {
			return str[i];//成功したらstrを返す
		} catch (e) {
			console.log("暗号化に失敗しました");
			throw "暗号化エラー";
		}
	},
	//復号
	async decrypt(path) {
		const angou = readFileSync(path, "utf-8");
		const dec = await this.strToDec(this.key);

		let str = [];
		str[0] = angou;
		let i, n;
		let y = 0;
		let x = dec;
		//繰り返し回数を予めざっくり計算
		for (n = 1; y < 4000000; n++) {
			y = x * 2 * String(n).length
			x = y;
		}
		// const dec2 = parseInt(dec / 35);
		const dec2 = n - 1;//繰り返し回数
		for (i = 0; i < dec2; i++) {
			str[i + 1] = "";
			const ilen = (dec2 -1 - i).toString().length;
			// console.log(ilen);
			for (let j = 0; j < str[i].length / (ilen + 1) ; j++) {
				const start = j * (ilen+1);
				const end = j * (ilen+1) + 1;

				// console.log(j + "/" + str[i].length + "," + ilen + "," + start + "," + end);
				const ancode = str[i].slice(start, end).charCodeAt(0) ^ (dec + dec2 - 1 - i);
				const hukugou = String.fromCharCode(ancode);
				// console.log(start + "," + end + "   " + str[i].slice(start, end) + " : " + str[i].slice(start, end).charCodeAt(0)+"   " + ancode + " : "+hukugou);

				// const hukugou = ancode;
				str[i + 1] += hukugou;
			}
			// console.log(str[i + 1] + "\n");
		}
		try {
			return JSON.parse(str[i]);
		} catch (e) {
			console.log("復号に失敗しました");
			throw "復号エラー";
		}
	}
}

