import { isNumberInRange } from "./myUtils";
import { control } from "./control";
import { AdvancedEventEmitter} from "./AdvancedEventEmitter"; // 変更

// キー入力イベントの型定義
export interface KeyInfo {
  sequence: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

// 変更: AdvancedEventEmitterで使用するイベントの型マップ
export interface KeyEventMap {
  keypress: { char: string; key: KeyInfo };
  enter: { char: string; key: KeyInfo };
  "basic-key": { char: string; key: KeyInfo };
  backspace: { char: string; key: KeyInfo };
}

// 変更: AdvancedEventEmitter<KeyEventMap> を継承
export class KeyInputEmitter extends AdvancedEventEmitter<KeyEventMap> {
  private keyListener: ((char: any, key: KeyInfo) => void) | undefined;

  constructor() {
    super();
    this.keyListener = undefined;
    this.init();
  }

  private init() {
    if (this.keyListener) return; // 二重初期化を防止

    const exitKeyList = ["\x03"]; // Ctrl+C
    this.keyListener = (char: any, key: KeyInfo): void => {
      process.stdout.write(control.nowrite);
      this.emit("keypress", { char, key });

      if (exitKeyList.includes(key.sequence)) {
        process.exit(0);
      }
      if (key.name === "return") {
        this.emit("enter", { char, key });
      }
      if (
        key.sequence &&
        isNumberInRange(key.sequence.charCodeAt(0), 33, 126) &&
        key.sequence.charCodeAt(0) !== 92
      ) {
        process.stdout.write(control.nowrite);
        this.emit("basic-key", { char, key });
      }
      if (key.name === "backspace") {
        this.emit("backspace", { char, key });
      }
    };
    process.stdin.on("keypress", this.keyListener);
    process.stdin.setRawMode(true);
    process.stdin.resume();
  }

  public exit() {
    if (this.keyListener) {
      process.stdin.removeListener("keypress", this.keyListener);
      this.keyListener = undefined;
    }
    // rawモードを解除しないと、プログラム終了後もターミナルがおかしくなることがある
    if(process.stdin.isRaw){
      process.stdin.setRawMode(false);
    }
  }
}
