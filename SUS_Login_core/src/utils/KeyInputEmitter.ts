import EventEmitter from "events";
import {isNumberInRange} from "./myUtils";
import {control} from "./control";

// キー入力を色々するときのEventクラス
// ここにenterを押したときとかのeventを登録していく感じ
// バグある可能性
export class KeyInputEmitter extends EventEmitter {
  private keyListener: ((char: any, key: any) => void) | undefined;

  constructor() {
    super();
    this.keyListener = undefined;
    // 標準入力の設定
    this.init();
  }

  init() {
    const exitKeyList = ["\x03"];
    this.keyListener = (char: any, key: any): void => {
      process.stdout.write(control.nowrite);
      // キー入力を受け取った時の処理
      this.emit("keypress", char, key);
      //終了処理したいときの処理
      if (exitKeyList.includes(key.sequence)) {
        process.exit(0);
      }
      //エンターキーを押した処理
      if (key.name === "return") {
        this.emit("enter", char, key);
      }
      //制御文字などを省いたキー
      if (
        isNumberInRange(key.sequence.charCodeAt(0), 33, 126) &&
        key.sequence.charCodeAt(0) !== 92
      ) {
        process.stdout.write(control.nowrite);
        this.emit("basic-key", char, key);
      }
      //backspaceを押した処理
      if (key.name === "backspace") {
        this.emit("backspace", char, key);
      }
    };
    process.stdin.on("keypress", this.keyListener);
    // キー入力をリッスン
    process.stdin.setRawMode(true);
    process.stdin.resume();
  }

  exit() {
    if (this.keyListener) {
      process.stdin.removeListener("keypress", this.keyListener);
    }
  }
}
