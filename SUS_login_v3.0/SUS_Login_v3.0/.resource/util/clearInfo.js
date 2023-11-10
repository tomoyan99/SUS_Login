const fs = require('fs');

exports = async function clearInfo(path) {
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
		},
		"last_upd": ""
	};

	fs.writeFileSync(path, JSON.stringify(info_json_raw));//info.jsonの初期化
	return;
}