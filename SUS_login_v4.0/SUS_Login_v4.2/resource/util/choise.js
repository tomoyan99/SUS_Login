"use strict";
/* 
	[choice.js]
	head,main,bottomを引数として受け取り、mainの選択肢を十字キーで選択。
	index等パックしたstateを返す
*/
import { control as cl } from "../util/control.js";

//エンコードをutf8に
process.stdin.setEncoding('utf8');
// 標準入力の受け取り
export async function choice(args = { head: [""], main: [""], bottom: [""] }) {
	let key = "";
	const mainStartNum = await printPrompt(args);//main領域開始行数
	const mainEndNum = args.main.length + mainStartNum -1; //main領域終了行数
	const bottomLineNum = mainEndNum+1 + args.bottom[0].split(/\n/g).length - 1;
	const promptStartNum = args.bottom[0].length + 5;
	const state = {
		option: args,
		index: [0, 0],
		chosing:()=>{
			return {
				index:[state.index[0],state.index[1]],
				str:state.option.main[state.index[0]][state.index[1]]
			};
		},
		indexMax: () => {
			return state.option.main.length - 1;
		},
		main_start: mainStartNum,
		main_end: mainEndNum,
		main_line: () => mainStartNum + state.index[0],
		printCyan: (start = 1, end = 1) => {
			const str = state.option.main[state.index[0]];
			process.stdout.write(`${cl.startLine(start)}`);
			str.forEach((s, i) => {
				const whichColor = (i == state.index[1]) ? cl.fg_cyan : cl.fg_reset;
				process.stdout.write(`${whichColor}${s}${cl.fg_reset}\t`);
			});
			process.stdout.write(`${cl.startLine(end)}\n`);
		},
		printChoice: (linestart = 1) => {
			//選択している項目の表示
			process.stdout.write(`${cl.startLine(linestart, promptStartNum)}`);
			process.stdout.write(`${state.option.main[state.index[0]][state.index[1]]}`);
			process.stdout.write(`${cl.rightClear}`);
		}
	}
	state.printCyan(state.main_line(), state.main_end);
	state.printChoice(bottomLineNum);
	// process.exit();
	for (; key.charCodeAt(0) !== 13;) {
		key = await inputKey(state);
		// process.exit();
		await printPrompt(args);
		state.printCyan(state.main_line(), state.main_end);
		state.printChoice(bottomLineNum);
	}
	console.log("\n");
	return state;
}


const inputKey = (state) => new Promise(resolve => {
	const stdin = process.stdin;
	const isRow = stdin.isRaw;
	const callBack = key => {
		//コントロールCが押されたら強制終了
		if (key === cl.CtrlC) process.exit(-1);
		//上下選択方向キーごとの関数
		const direction = {
			"\x1b[A":
				function up() {
					//上キー押したらindex[0]-1
					state.index[0]--;
					//オーバーフローしたら下端へ
					if (state.index[0] < 0) {
						state.index[0] = state.indexMax();
					}
					//直上に何もコマンドがなければ横はリセット。あればそのまま
					if (state.option.main[state.index[0]][state.index[1]] === undefined) {
						state.index[1] = 0;
					}else{
						;
					}
				},
			"\x1b[B":
				function down() {
					//下キー押したらindex[0]+1
					state.index[0]++;
					//オーバーフローしたら上端へ
					if (state.index[0] > state.indexMax()) {
						state.index[0] = 0;
					}
					//直下に何もコマンドがなければ横はリセット。あればそのまま
					if (state.option.main[state.index[0]][state.index[1]] === undefined) {
						state.index[1] = 0;
					} else {
						;
					}
				},
			"\x1b[C":
				function right() {
					//横要素があるときに右キー押したらindex[1]+1
					if (state.option.main[state.index[0]].length > 1) {
						//右端に行くまでOK

						if (state.index[1] < state.option.main[state.index[0]].length - 1) {
							state.index[1]++;
						} else {
							;
						}
					}
				},
			"\x1b[D":
				function left() {
					//既に横要素にいるときは左キー押したらindex[1]-1
					if (state.index[1] >= 1) {
						state.index[1]--;
						//左端にいるときは何もしない
					} else if (state.index[1] === 0) {
						;
					}
				}
		}
		try {
			direction[key]();
		} catch (e) {
			;
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

async function printPrompt(args = { head: [""], main: [""], bottom: [""] }) {
	const headLineNum = args.head[0].split(/\n/g).length - 1;
	const mainLineNum = args.main.length;
	const bottomLineNum = args.bottom[0].split(/\n/g).length - 1;
	const headStartNum = 1;
	const mainStartNum = headStartNum + headLineNum;
	const bottomStartNum = mainStartNum + mainLineNum;
	const bottomEndNum = bottomStartNum + bottomLineNum;

	console.clear();
	args.head.forEach((i) => {
		process.stdout.write(i);
	})
	args.main.forEach((i, ind) => {
		for (let j = 0; j < i.length; j++) {
			// process.stdout.write(mainStartNum+ind+"  "+i[j]);
			process.stdout.write(`${i[j]}\t`);
		}
		console.log();
	});
	// process.stdout.write(bottomStartNum+"  "+args.bottom);
	process.stdout.write(args.bottom[0]);
	console.log();
	return mainStartNum;
}


// (async () => {
// 	const options = {
// 		head: [`SUS_login_v3.1\n${cl.fg_green}十字キーで開きたい項目を選択してね${cl.fg_reset}\n\n`],
// 		main: [["1.euc"], ["2.sola", ">>List"], ["3.sclass"], ["4.sclassとsola"]],
// 		bottom: ["選択?>"]
// 	}
// 	const state = await choice(options);
// 	const whatchoose = state.option.main[state.index[0]][state.index[1]];
// })();