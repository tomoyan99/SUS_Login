import { EventEmitter2 } from "eventemitter2";

export class StdoutCapture extends EventEmitter2 {
    private originalWrite: typeof process.stdout.write; // 元の標準出力
    private output: string = ""; // キャプチャされた出力を格納するバッファ

    constructor() {
        super();
        this.originalWrite = process.stdout.write;
    }

    startCapturing(): void {
        this.output = ""; // バッファを初期化
        // 標準出力をオーバーライド
        process.stdout.write = (str: string): boolean => {
            this.output += str; // バッファに追加
            this.emit("data", str); // イベントを発火
            return true; // 常に成功として返す
        };
    }

    stopCapturing(): string {
        process.stdout.write = this.originalWrite; // 元の標準出力に戻す
        return this.output; // キャプチャされた出力を返す
    }

    getCapturedOutput(): string {
        return this.output; // 現時点までのキャプチャを取得
    }
}
