import { createInterface } from 'readline';


process.stdin.setEncoding('utf8');
const CtrlC = "\u0003";
const erathe = "\b\b\x1b[0K";
const nowrite = "\b\x1b[0K";

const inputKey = (prompt) => new Promise(resolve => {
	const stdin = process.stdin;
	const isRow = stdin.isRaw;
	const callBack = (key = "") => {
		stdin.off("data", callBack);
		stdin.pause();
		stdin.setRawMode(isRow);
		//上キーとかのエスケープで始まる文字は非表示
		if (key.charCodeAt(0) === 27) {
			resolve("");//promiseの返り値としてkeyを返す
		} else {
			for (const i of key) {
				process.stdout.write("*");
			}
			resolve(key);//promiseの返り値としてkeyを返す
		}
	};
	stdin.setRawMode(true);//エンター以外の各キーを押したときもstdin.onを実行するようにする
	stdin.resume();//標準入力の待機状態にする
	stdin.on("data", callBack);//キー入力を受け取る。キー内容はコールバック関数の第一引数として渡される
});


// 標準入力の受け取り
export async function input(prompt, ishide = false) {
	if (ishide === false) {
		//readlineの入出力インターフェースを指定
		const readInterface = createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		return new Promise((resolve) => {
			readInterface.question(prompt, (input) => {
				readInterface.close();
				resolve(input);
			});
		});
	} else if (ishide === true) {
		let key = "";
		process.stdout.write(prompt);
		let str = "";
		//ENTARキーが押されるまでforループ
		for (; ;) {
			key = await inputKey();//入力したキーを孵す
			// console.log(key.charCodeAt(0));
			//ヌル文字～ユニット区切り文字は許さない
			if (key.charCodeAt(0) - 31 <= 0 && //ヌル文字～まで
				(key.charCodeAt(0) !== 13 && //スペース
					key.charCodeAt(0) !== 8 && //バックスペース
					key.charCodeAt(0) !== 3	 //Ctrl+C
				)) {
				process.stdout.write(nowrite);
			}
			//ENTERキーが押されたら終了
			if (key === "\x0d") {
				process.stdout.write(nowrite);
				console.log();
				return str;
			}
			if (key === CtrlC) {
				process.stdout.write(nowrite);
				process.exit(-1);//Ctrl+Cでプロセスの終了
			}
			//バックスペースが押されたとき
			if (key === "\b") {
				if (str !== "") {
					//二文字消去して一つ前の入力も消去
					process.stdout.write(erathe);
					str = str.slice(0, str.length - 1);
				} else {
					process.stdout.write(nowrite);
				}
				continue;
			}
			//タブが押されたとき
			if (key === "\t") {
				//一文字消去して何もさせない
				// process.stdout.write(nowrite);
				key = "";
				continue;
			}
			str += key;
		}
	}
};
