
process.stdin.setEncoding('utf8');

/* 制御文字一覧 */
const CtrlC = "\u0003";
const erathe = "\b\b\x1b[0K";
const nowrite = "\b\x1b[0K";
const nocursor = "\x1b[>5h";

/* 文字色 */
const fg_black = '\x1b[30m';
const fg_red = '\x1b[31m';
const fg_green = '\x1b[32m';
const fg_yellow = '\x1b[33m';
const fg_blue = '\x1b[34m';
const fg_magenta = '\x1b[35m';
const fg_cyan = '\x1b[36m';
const fg_white = '\x1b[37m';
const fg_reset = '\x1b[0m';

/* 背景色 */
const bg_black = "\x1b[40m"
const bg_red = "\x1b[41m"
const bg_green = "\x1b[42m"
const bg_yellow = "\x1b[43m"
const bg_blue = "\x1b[44m"
const bg_magenta = "\x1b[45m"
const bg_cyan = "\x1b[46m"
const bg_white = "\x1b[47m"
const bg_reset = "\x1b[49m"


const startLine = (r=1,n=1) => `\x1b[${r};${n}H`;//スタート位置の決定

const rightClear = "\x1b[0K";//カーソルより右側消去


const inputKey = (state) => new Promise(resolve => {
	const stdin = process.stdin;
	const isRow = stdin.isRaw;
	const callBack = key => {
		//コントロールCが押されたら強制終了
		if (key === CtrlC) process.exit(-1);
		//上下選択方向キーごとの関数
		const direction = {
			"\x1b[A":
				function ue() {
					state.index = (state.index + (state.option.length - 3)) % (state.option.length - 1) + 1;
					process.stdout.write(`${startLine(state.start + state.index - 1)}${fg_cyan}${state.option[state.index]}${fg_reset}`);
				},
			"\x1b[B":
				function sita() {
					state.index = (state.index) % (state.option.length - 1) + 1;
					process.stdout.write(`${startLine(state.start + state.index - 1)}${fg_cyan}${state.option[state.index]}${fg_reset}`);
				}
		}
		try {
			//文字色の初期化
			for (let i = state.start; i < state.start + state.option.length - 1; i++) {
				process.stdout.write(`${startLine(i)}${fg_reset}${state.option[i-state.start+1]}${rightClear}`);
			}
			direction[key]();
			console.log(`${startLine(state.start + state.option.length - 1,8)}${state.option[state.index]}${rightClear}`);//選択している項目の表示
		} catch (e) {
			process.stdout.write("");
		}
		stdin.off("data", callBack);
		stdin.pause();
		stdin.setRawMode(isRow);
		resolve(key);//resolve
	};
	stdin.setRawMode(true);
	stdin.resume();
	stdin.on("data", callBack);
});


// 標準入力の受け取り
module.exports = async function choice(prompt="選択?>" ,state={option:[""],index:1,start:1,prompt:prompt}) {
	let key = "";
	process.stdout.write(prompt);
	for (; key.charCodeAt(0) !== 13;) {
			key = await inputKey(state);
		}
	console.log("\n\n");
	return key;
}