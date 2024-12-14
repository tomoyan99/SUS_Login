import { StdoutCapture } from "../src/utils/StdoutCapture";
import {appendFileSync, writeFileSync} from "fs";

async function main() {
    console.log("Start of main function.");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒待つ
    console.log("End of main function.");
}

(async () => {
    const capture = new StdoutCapture();
    writeFileSync("./log.log","");

    // キャプチャ中のデータをリアルタイムで処理するリスナーを設定
    capture.on("data", (data: string) => {
        appendFileSync("./log.log",`${new Date()} [Captured]: ${data.trim()}\n`);
    });

    // キャプチャを開始
    capture.startCapturing();

    // メイン関数を実行
    await main();

    // キャプチャを終了
    const capturedOutput = capture.stopCapturing();

    console.log("Captured Output:");
    console.log(capturedOutput); // 全てのキャプチャ結果を表示
})();
