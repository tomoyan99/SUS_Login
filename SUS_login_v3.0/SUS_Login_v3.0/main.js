// const {execSync, execFileSync} = require('child_process');
const fs = require('fs');
const login = require('./resource/login');
const clearInfo = require('./resource/util/clearInfo');
const version = "3.0";

(async function main(){
	if (!fs.existsSync("./SUS_Login_v"+version)) {
		fs.mkdirSync("./SUS_Login_v" + version);
		// imagesフォルダがあるか判定。なければ作成
		if (!fs.existsSync("./SUS_Login_v" + version+"/images")) {
			fs.mkdirSync("./SUS_Login_v" + version + "/images");
		}
		// logsフォルダがあるか判定。なければ作成
		if (!fs.existsSync("./SUS_Login_v" + version + "/logs")) {
			fs.mkdirSync("./SUS_Login_v" + version + "/logs");
		}
		// dataフォルダがあるか判定。なければ作成
		if (!fs.existsSync("./SUS_Login_v" + version + "/data")) {
			fs.mkdirSync("./SUS_Login_v" + version + "/data");
			await clearInfo("./SUS_Login_v" + version + "/data/info.js");
		}
	}	
	console.clear();
	try {
		// console.log("in2")
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
