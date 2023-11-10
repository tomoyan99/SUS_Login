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
		if (key === "\x0d" || key === CtrlC) {
			resolve(key);//promiseの返り値としてkeyを返す
		} else {
			resolve("");
		}
	};
	stdin.setRawMode(true);//エンター以外の各キーを押したときもstdin.onを実行するようにする
	stdin.resume();//標準入力の待機状態にする
	stdin.on("data", callBack);//キー入力を受け取る。キー内容はコールバック関数の第一引数として渡される
});


// エンター待機
export async function pause(prompt="") {
	let key = "";
	process.stdout.write(`${prompt}\n`);
	let str = "";
	//ENTARキーが押されるまでforループ
	for (; ;) {
		key = await inputKey();//入力したキーを返す
		if (key === "") {
			continue;
		}
		//ENTERキーが押されたら終了
		if (key === "\x0d") {
			process.stdout.write(nowrite);
			console.log();
			break;
		}
		if (key === CtrlC) {
			// process.stdout.write(nowrite);
			process.exit(-1);//Ctrl+Cでプロセスの終了
		}
	}
	return 0;
};
