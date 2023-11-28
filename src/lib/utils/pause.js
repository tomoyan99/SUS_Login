import {KeyInputEmitter} from "./KeyInputEmitter.js";

export async function pause(mode="pause",prompt = "[何かキーを押して終了]"){
	return new Promise((resolve)=>{
		// KeyInputEmitterのインスタンスを作成
		const KIE = new KeyInputEmitter();
		// キー入力のイベントをリッスンして表示
		KIE.on('keypress', (char, key) => {
			if (mode === "exit"){
				process.exit(0);
			}else if(mode === "pause"){
				resolve(0);
			}
		});
		console.log(prompt);
	});
}

