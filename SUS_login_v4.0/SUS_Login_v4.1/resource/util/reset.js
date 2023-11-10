import fs from "fs";
/* 
	[reset.js]
	info.jsonをリセットする
*/


export async function reset(path) {
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
			"url": "https://sola.sus.ac.jp/",
			"target": {
				"name": "#identifier",
				"pass": "#password",
				"submit": "button[type=submit]",
			}
		},
		"last_upd": ""
	};

	fs.writeFileSync(path, JSON.stringify(info_json_raw));//info.jsonの初期化
	return;
}