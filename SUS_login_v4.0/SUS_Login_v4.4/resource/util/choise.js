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
export async function choice(args = { head: [], main: [], bottom: [],networkConnected:async()=>{return true} }) {
	let oldconnect = await args.networkConnected();
	let key = "";
	let mainStartNum = 0;
	let mainEndNum = 0
	let bottomLineNum = 0;
	let promptStartNum = 0;
	async function setPropaties(){
		mainStartNum = await printPrompt(args);//main領域開始行数
		mainEndNum = args.main.length + mainStartNum -1; //main領域終了行数
		bottomLineNum = mainEndNum+1 + args.bottom[0].split(/\n/g).length - 1;
		promptStartNum = args.bottom[0].length + 5;
	}
	let state =  {
		option: args,
		index: [0, 0],
		networkChenged:false,
		chosing:()=>{
			return {
				index:[state.index[0],state.index[1]],
				str_raw:state.option.main[state.index[0]][state.index[1]],
				str: state.option.main[state.index[0]][state.index[1]].replace(/\x1b\[([0-9]{1,3}((;[0-9]{1,3})*)?)?[mGK]/g, "")
			};
		},
		indexMax: () => {
			return state.option.main.length - 1;
		},
		main_start: mainStartNum,
		main_end: mainEndNum,
		main_line: () => mainStartNum + state.index[0],
		printCyan: (start = 1, end = 1) => {
			const str = state.option.main[state.index[0]];//選択中の項目名を取得
			process.stdout.write(`${cl.startLine(start)}`);//目的の行頭まで移動
			//横項目の色付けと、選択していない項目の色抜き
			//forEachのiと横indexが一致するもののみ色付けすることで色が残ったりしない
			str.forEach((s="str", i) => {
				const s_only_char = s.replace(/\x1b\[([0-9]{1,3}((;[0-9]{1,3})*)?)?[mGK]/g,""); //文字列からエスケープシーケンスを除いたもの
				const whichColor = (i === state.index[1]) ? cl.fg_cyan : cl.fg_reset; //選択中の横indexとiが一致するもののみ色付け
				const whichStr = (i === state.index[1]) ? s_only_char : s; // 選択中の横indexとiが一致するものはエスケープシーケンスを除く。こうすることで色が付けられる。
				process.stdout.write(`${whichColor}${whichStr}${cl.fg_reset}\t`);//出力
			});
			process.stdout.write(`${cl.startLine(end)}\n`);//改行出力
		},
		printChoice: (linestart = 1) => {
			//選択している項目の表示
			process.stdout.write(`${cl.startLine(linestart, promptStartNum)}`);
			process.stdout.write(`${state.option.main[state.index[0]][state.index[1]]}`);
			process.stdout.write(`${cl.rightClear}`);
		}
	};
	await setPropaties();
	state.printCyan(state.main_line(), state.main_end);
	state.printChoice(bottomLineNum);

	const headID = setInterval(async()=>{
		if (oldconnect !== await args.networkConnected()){
			console.clear();
			await setPropaties();
			state.printCyan(state.main_line(), state.main_end);
			state.printChoice(bottomLineNum);
			oldconnect = await args.networkConnected();
			state.networkChenged = true;
		}
	},2000);

	for (; key.charCodeAt(0) !== 13;) {
		key = await inputKey(state);
		await setPropaties();
		state.printCyan(state.main_line(), state.main_end);
		state.printChoice(bottomLineNum);
	}
	console.log("\n");
	clearInterval(headID);

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

/**
 * 値の変更を監視します
 * @param {Object} obj 監視対象のオブジェクト
 * @param {String} propName 監視対象のプロパティ名
 * @param {function(Object, Object)} func 値が変更された際に実行する関数
 */
function watchValue(obj, propName, func) {
	let value = obj[propName];
	Object.defineProperty(obj, propName, {
		get: () => value,
		set: newValue => {
			const oldValue = value;
			value = newValue;
			func(oldValue, newValue);
		},
		configurable: true
	});
}

/**
 * 配列オブジェクトの動作を監視します
 * @param {Array} array 監視したい配列
 * @param {function(Array, Array)} onChange 変更時の動作
 */
function watchArray(array, onChange) {
	let deletedArray = null;
	return new Proxy(array, {
		// プロパティ削除時の動作をカスタマイズ
		deleteProperty: (target, property) => {
			// 削除操作呼び出し直後は empty item になるため、
			deletedArray = [...array];
			const result = Reflect.deleteProperty(target, property);
			return result;
		},
		// プロパティ設定時の動作をカスタマイズ
		set: (target, property, val, receiver) => {
			const oldArray = [...array];
			const result = Reflect.set(target, property, val, receiver);
			if (deletedArray) {
				// 削除操作を伴う場合の検知
				console.log(target);
				onChange(deletedArray, target);
				deletedArray = null;
			} else if (property !== 'length') {
				// その他：追加や変更の検知
				console.log(target);
				onChange(oldArray, target);
			}
			return result;
		},
	});
}

/**
 * 与えられたオブジェクトのプロパティを監視します
 * @param {Object}obj 監視対象のオブジェクト
 * @param {function(Object, Object)} func 値が変更された際に実行する関数
 */
function watchAll(obj, func) {
	Object.getOwnPropertyNames(obj).forEach(propName => {
	if (propName !== "length") {
		const val = obj[propName];
		if ((val instanceof Object) && !Array.isArray(val)) {
			// オブジェクトの場合
			watchAll(val, func);
		} else if (Array.isArray(val)) {
			// 配列の場合
			obj[propName] = watchArray(val, func);
		} else {
			// その他の場合
			watchValue(obj, propName, func);
		}
	}
	});
}
