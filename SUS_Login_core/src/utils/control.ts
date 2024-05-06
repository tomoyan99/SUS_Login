"use strict";
/* 
	[control.js]
	制御文字一般を扱う。コンソール操作用
*/
export const control = {
  /* 制御文字一覧 */
  CtrlC: "\u0003", //コントロール+C
  erathe: "\b\b\x1b[0K", //一文字消す
  nowrite: "\b\x1b[0K", //書き込まない
  rightClear: "\x1b[0K", //カーソルより行の右側消去
  lineClear: "\x1b[2K", //行消去
  underline: "\x1b[4m",
  startLine: (r = 1, n = 1) => `\x1b[${r};${n}H`, //スタート位置の決定
  initialLine: (n = 1) => `\x1b[${n}G`, //指定行目の行頭に移動

  /* 方向キー */
  up: "\x1b[A", //上
  down: "\x1b[B", //下
  right: "\x1b[C", //右
  left: "\x1b[D", //左
  /* 文字色 */
  fg_black: "\x1b[30m", //黒
  fg_red: "\x1b[31m", //赤
  fg_green: "\x1b[32m", //緑
  fg_yellow: "\x1b[33m", //黄色
  fg_blue: "\x1b[34m", //青
  fg_magenta: "\x1b[35m", //紫っぽいマゼンタ
  fg_cyan: "\x1b[36m", //水色っぽいシアン
  fg_white: "\x1b[37m", //白
  fg_reset: "\x1b[0m", //リセット

  /* 背景色 */
  bg_black: "\x1b[40m", //黒
  bg_red: "\x1b[41m", //赤
  bg_green: "\x1b[42m", //緑
  bg_yellow: "\x1b[43m", //黄色
  bg_blue: "\x1b[44m", //青
  bg_magenta: "\x1b[45m", //マゼンタ
  bg_cyan: "\x1b[46m", //シアン
  bg_white: "\x1b[47m", //白
  bg_reset: "\x1b[49m", //リセット

  /* オトクなセット */
  warn: "\x1b[43m\x1b[30m",
  error: "\x1b[41m\x1b[37m",
  reset: "\x1b[0m\x1b[49m",
};