import { IpcApi } from "./index"; // preload/index.ts から型定義をインポート

declare global {
  interface Window {
    // ここで `window.ipc` に型を付ける
    ipc: IpcApi;
  }
}
