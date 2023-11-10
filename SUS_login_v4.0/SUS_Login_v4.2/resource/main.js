"use strict";
/* 
	[main.js]
	フォルダの作成、login.jsの実行などの総合的な制御を行う。
*/
import fs from 'fs';
import {login} from './login.js';
import {reset} from './util/reset.js';　//info.jsonのreset
const version = "4.2";//バージョン


(async function main(){
		// imagesフォルダがあるか判定。なければ作成
		if (!fs.existsSync("./images")) {
			fs.mkdirSync("./images");
		}
		// logsフォルダがあるか判定。なければ作成
		if (!fs.existsSync("./logs")) {
			fs.mkdirSync("./logs");
		}
		// dataフォルダがあるか判定。なければ作成
		if (!fs.existsSync("resource/data")) {
			fs.mkdirSync("resource/data");
		}
		if (!fs.existsSync("resource/data/info.json")) {
			await reset("resource/data/info.json");
		}
	console.clear();
	try {
		//login関数に入る
		await login(version);
	} catch (e) {
		console.log(e);
	}finally{
		pause();
	}
})();

function pause() {
	console.log('何かキーを押して終了します');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));	
}
