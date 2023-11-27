import EventEmitter from "events";
import * as readline from "readline";

class KeyInputEmitter extends EventEmitter {
	constructor() {
		super();
		this.init();
	}
	init() {
		// 標準入力の設定
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		// キー入力を受け取った時の処理
		rl.input.on('keypress', (char, key) => {
			this.emit("keypress")
			// 何かしらが入力されたら終了
			rl.close();
		});

		// キー入力をリッスン
		rl.input.setRawMode(true);
		rl.resume();
	}
}

export async function pause(mode="pause",prompt = "[何かキーを押して終了]"){
	return new Promise((resolve)=>{
		// KeyInputEmitterのインスタンスを作成
		const keyInputEmitter = new KeyInputEmitter();
		// キー入力のイベントをリッスンして表示
		keyInputEmitter.on('keypress', (char, key) => {
			process.exit(0);
		});
		process.on("exit",()=>{
			console.log("exit")
		})
		console.log(prompt);
	});
}

