"use strict";
/* 
	[resetInfo.js]
	reset.jsをウィザード化。独立したexeファイルとしてアプリ化する
*/

import {input} from './input.js';
import {reset} from './reset.js';

/* sleep関数 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
/* pause関数 */
function pause() {
	console.log('何かキーを押して終了します');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));
}

const version = "2.0";
	(async () => {
		console.clear();
		console.log("Reset.exe v" + version);
		console.log("Reset.exeはパスワード入力などをミスしたときにinfo.jsonを初期化できるプログラムです");

		const count = await (async function inputYN() {
			const yesno = await input("初期化しますか？[Y/N]\n");
			switch (true) {
				case /[Yy]/.test(yesno):
					console.log("resource/data/info.jsonを初期化します");
					return 0;
				case /[Nn]/.test(yesno):
					console.log("resource/data/info.jsonは初期化しません");
					return 1;
				default:
					console.log("Yy/Nnで入力してください");
					await inputYN();
					return 0;
			}
		})();
		if (count === 1) {
			pause();
		}else{
			await reset("resource/data/info.json");
			process.stdout.write("resource/data/info.jsonを初期化しています");

			for (let i = 0; i < 4; ++i) {
				await sleep(500);
				process.stdout.write("・");
			}
			console.log("\nresource/data/info.jsonの初期化が完了しました");
			pause();
		}
})();	