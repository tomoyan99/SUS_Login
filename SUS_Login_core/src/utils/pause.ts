import { KeyInputEmitter } from "./KeyInputEmitter";

export function pause(
  mode: "pause" | "exit" = "pause",
  prompt = "[何かキーを押して終了]",
  func = console.log,
) {
  return new Promise((resolve) => {
    // KeyInputEmitterのインスタンスを作成
    const KIE = new KeyInputEmitter();
    // キー入力のイベントをリッスンして表示
    KIE.on("keypress", () => {
      if (mode === "exit") {
        KIE.exit();
        process.exit(0);
      } else if (mode === "pause") {
        KIE.exit();
        resolve(true);
      }
    });
    func(prompt);
  });
}

