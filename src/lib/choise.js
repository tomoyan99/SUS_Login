"use strict";
/*
	[choice.js]
	head,body,footを引数として受け取り、bodyの選択肢を十字キーで選択。
	index等パックしたstateを返す
*/
import {control as cl} from ".//control.js";

//エンコードをutf8に
process.stdin.setEncoding('utf8');
// 標準入力の受け取り
export async function choice(args = { Menu:{ head:[], body:[], foot:[] }}) {

	let key = "";

	class States {
		constructor() {
			this.Options 	= {};
			this.index = [0,0];
			this.index_old = [0,0];
			this.H_Start = 0;
			this.H_Line	 = 0;
			this.H_End   = 0;
			this.B_Start = 0;
			this.B_Line  = 0;
			this.B_End   = 0;
			this.F_Start = 0;
			this.F_Line  = 0;
			this.F_End   = 0;
			this.F_len	 = 0;
			this.errorStatus_Old = args.errorStatus;
			this.index_space = "\t";
		}
		static async build(args){
			class Prints extends this{
				constructor() {
					super();
				}
				/**
				 * 指定箇所を青く色付け表示する関数
				 * */
				async printCyan(){
					const Index_Start 	  = this.B_Start + this.index[0];//ボディ開始行
					const Index_Old_Start = this.B_Start + this.index_old[0]//ボディ開始行
					const B_End   		  = this.B_End;  //ボディ終了行
					const str 			  = this.Options.body[this.index[0]];//選択中の項目名を取得
					const str_old 		  = this.Options.body[this.index_old[0]];//選択中の項目名を取得

					/** 前回選択されていた部分は元の色に戻す*/
					process.stdout.write(`${cl.startLine(Index_Old_Start)}`);//前回選択の行頭まで移動
					str_old.forEach((s="", i) => {
						process.stdout.write(`${s}${this.index_space}`);//出力
					});

					/** 今回選択のものは横indexを見て、指定のものだけ色つけ*/
					process.stdout.write(`${cl.startLine(Index_Start)}`);//目的の行頭まで移動
					//横項目の色付けと、選択していない項目の色抜き
					//forEachのiと横indexが一致するもののみ色付けすることで色が残ったりしない
					str.forEach((s="", i) => {
						const s_only_char = s.replace(/\x1b\[([0-9]{1,3}((;[0-9]{1,3})*)?)?[mGK]/g,""); //文字列からエスケープシーケンスを除いたもの
						const whichColor = (i === this.index[1]) ? cl.fg_cyan : cl.fg_reset; //選択中の横indexとiが一致するもののみ色付け
						const whichStr = (i === this.index[1]) ? s_only_char : s; // 選択中の横indexとiが一致するものはエスケープシーケンスを除く。こうすることで色が付けられる。
						process.stdout.write(`${whichColor}${whichStr}${cl.fg_reset}${this.index_space}`);//出力
					});
					process.stdout.write(`${cl.startLine(B_End)}\n`);//改行出力
				}
				/**
				 * 選択中の項目をフッターの横に表示する関数
				 * */
				async printChoice(){
					const F_start = this.F_End;
					const P_Start = this.P_Start;
					//選択している項目の表示
					process.stdout.write(`${cl.startLine(F_start, P_Start)}\t`);
					process.stdout.write(`${this.Options.body[this.index[0]][this.index[1]]}`);
					process.stdout.write(`${cl.rightClear}`);
				}

				/**
				 * argsを受け取ってその通りに画面に表示する関数
				 * */
				async printPrompt() {
					const Options = this.Options;
					console.clear();
					/*
                    * 描画処理部
                    * foreachを用いているのは、body:[["1","2"],["3"]]のように区切られている場合にも対応するため
                    * ↑の表示例：
                    * 1		2
                    * 3
                    * */

					//ヘッダー、ボディ、フッターの描画
					for (const optionsKey in Options) {
						// console.log(Options[optionsKey][0]);
						Options[optionsKey].forEach((array) => {
							array.forEach((prop)=>{
								process.stdout.write(`${prop}${this.index_space}`);
							});
							console.log();
						});
					}
				}
				/**
				 * printPrompt,printChoice,printCyanを一括でやってくれる
				 * */
				async render(args){
					await this.clearIndex();
					await this.setProperties(args);
					await this.printPrompt();
					await this.printCyan();
					await this.printChoice();
				}
			}
			const ST = new Prints();
			await ST.render(args);
			return ST;
		}
		async setProperties(args){
			/** 表示する内容*/
			this.Options = args.Menu;

			/** 現在選択中のプロンプト*/
			this.nowPrompt = ()=>this.Options.body[this.index[0]][this.index[1]];

			/** ヘッダーの開始行*/
			this.H_Start = 1;
			/** ヘッダーの行数*/
			this.H_Line = args.Menu.head.length;
			/** ヘッダーの終了行*/
			this.H_End = this.H_Start+this.H_Line - 1;
			/** ボディの開始行*/
			this.B_Start = this.H_End + 1;
			/** ボディの行数*/
			this.B_Line = args.Menu.body.length;
			/** ボディの終了行*/
			this.B_End = this.B_Start + this.B_Line - 1;
			/** フッターの開始行*/
			this.F_Start = this.B_End + 1;
			/** フッターの行数*/
			this.F_Line = args.Menu.foot.length;
			/** フッターの終了行*/
			this.F_End = this.F_Start + this.F_Line - 1;
			/** フッターの文字数*/
			this.F_Len = args.Menu.foot[this.F_Line - 1].length;
			/**　現在の選択肢(プロンプト)を表示する位置*/
			this.P_Start = this.F_Len + 5;
			/**　現在の選択肢(プロンプト)の文字数*/
			this.P_Len = this.nowPrompt().length;
			/**　現在の選択肢(プロンプト)の終端*/
			this.P_End = this.P_Start + this.P_Len;

		}
		async clearIndex(){
			/** インデックスの初期化*/
			this.index = [0,0];
			this.index_old = [0,0];
		}
		get LineNum(){
			return {
				/** ヘッダーの開始行*/
				H_Start : this.H_Start,
				/** ヘッダーの行数*/
				H_Line : this.H_Line,
				/** ヘッダーの終了行*/
				H_End : this.H_End,
				/** ボディの開始行*/
				B_Start : this.B_Start,
				/** ボディの行数*/
				B_Line : this.B_Line,
				/** ボディの終了行*/
				B_End : this.B_End,
				/** フッターの開始行*/
				F_Start : this.F_Start,
				/** フッターの行数*/
				F_Line : this.F_Line,
				/** フッターの終了行*/
				F_End : this.F_End,
				/** フッターの文字数*/
				F_Len : this.F_Len,
				/**　現在の選択肢(プロンプト)を表示する位置*/
				P_Start : this.F_Len + 5,
				/**　現在の選択肢(プロンプト)の文字数*/
				P_Len : this.nowPrompt().length,
				/**　現在の選択肢(プロンプト)の終端*/
				P_End : this.P_Start + this.P_Len,
			}
		}
		//横項目の最大数を取得
		get indexMax(){return args.Menu.body.length - 1;}
		//現在選択したものindexと選択肢名を返す
		get choosing(){
			return {
				index:[state.index[0],state.index[1]],
				str_raw:args.Menu.body[state.index[0]][state.index[1]],
				str: args.Menu.body[state.index[0]][state.index[1]].replace(/\x1b\[([0-9]{1,3}((;[0-9]{1,3})*)?)?[mGK]/g, ""),
			};
		}
	}

	const state = await States.build(args);//stateオブジェクトのインスタンス化

	//ネットワークの変更を検知
	const headID = setInterval(async()=>{
		if (state.errorStatus_Old !== args.errorStatus){
			await state.render(args);
			state.errorStatus_Old = args.errorStatus;
		}
	},10);

	//エンターキーが押されるまでキーを受け付け続ける
	for (; key.charCodeAt(0) !== 13;) {
		key = await inputKey(state); //方向キーやエンターキーなどの入力したキーを逐一保存
		await state.printCyan();
		await state.printChoice();
	}
	console.log("\n");
	// clearInterval(headID);
	return state.choosing;
}

/** キー操作に応じて、引数のstateを弄る
 * @param {Object} state //カーソル選択したい文章とindexが入ってる
 * @return {Promise}
 * */
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
						state.index[0] = state.indexMax;
					}
					//直上に何もコマンドがなければ横はリセット。あればそのまま
					if (state.Options.body[state.index[0]][state.index[1]] === undefined) {
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
					if (state.index[0] > state.indexMax) {
						state.index[0] = 0;
					}
					//直下に何もコマンドがなければ横はリセット。あればそのまま
					if (state.Options.body[state.index[0]][state.index[1]] === undefined) {
						state.index[1] = 0;
					} else {
						;
					}
				},
			"\x1b[C":
				function right() {
					//横要素があるときに右キー押したらindex[1]+1
					if (state.Options.body[state.index[0]].length > 1) {
						//右端に行くまでOK

						if (state.index[1] < state.Options.body[state.index[0]].length - 1) {
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
			state.index_old = state.index.concat();
			direction[key]();//方向以外のキーが押された場合、エラーが起きるが握りつぶす
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



