import {KeyInputEmitter} from "./KeyInputEmitter.js";

/**
 * @param {("pause"|"exit")} mode
 * @param {("[何かキーを押して終了]"|"[何かキーを押して続ける]"|string)} prompt
 * @param {function} func
 * */
export function pause(mode="pause",prompt = "[何かキーを押して終了]",func=console.log){
	return new Promise((resolve, reject)=>{
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
		func(prompt);
	});
}

