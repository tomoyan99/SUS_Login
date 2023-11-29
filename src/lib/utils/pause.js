import {KeyInputEmitter} from "./KeyInputEmitter.js";

/**
 * @param {("pause"|"exit")} mode
 * @param {("[何かキーを押して終了]"|"[何かキーを押して続ける]"|string)} prompt
 * */
export function pause(mode="pause",prompt = "[何かキーを押して終了]"){
	return new Promise((resolve)=>{
		// KeyInputEmitterのインスタンスを作成
		const KIE = new KeyInputEmitter();
		// キー入力のイベントをリッスンして表示
		KIE.on('keypress', (char, key) => {
			if (mode === "exit"){
				KIE.exit();
				process.exit(0);
			}else if(mode === "pause"){
				KIE.exit();
				resolve(0);
			}
		});
		console.log(prompt);
	});
}

