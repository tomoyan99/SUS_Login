const input = require('./input');
const fs = require('fs');


/* sleep関数 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
/* pause関数 */
function pause() {
	console.log('何かキーを押して終了します');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));
}
//info.jsonのテンプレ
const info_json_raw = {
	"username": "",
	"password": "",
	"sclass": {
		"url": "https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp",
		"target": {
			"name": ".inputText",
			"pass": ".inputSecret",
			"submit": "input[type=image]"
		}
	},
	"sola": {
		"url": "https://sus.ex-tic.com/auth/session",
		"target": {
			"name": "#identifier",
			"pass": "#password",
			"submit": "button[type=submit]",
			"a": "a#a-2"
		}
	}
};

const version = "1.0";
	(async () => {
		console.clear();
		console.log("InfoClear_v" + version);
		console.log("InfoClearはパスワード入力などをミスしたときにinfo.jsonを初期化できるおプログラムです");

		const count = await (async function inputYN() {
			const yesno = await input("初期化しますか？[Y/N]\n");
			switch (true) {
				case /[Yy]/.test(yesno):
					console.log("resource/info.jsonを初期化します");
					return 0;
				case /[Nn]/.test(yesno):
					console.log("resource/info.jsonは初期化しません");
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
			fs.writeFileSync("resource/info.json", JSON.stringify(info_json_raw));//info.jsonの初期化

			process.stdout.write("resource/info.jsonを初期化しています");

			for (let i = 0; i < 4; ++i) {
				await sleep(500);
				process.stdout.write("・");
			}
			console.log("\nresource/info.jsonの初期化が完了しました");
			pause();
		}
})();	
