import { ipcMain, ipcRenderer, webContents } from "electron";

export interface ReqRes<T,U> {
    request: T;
    response: U;
}

// IPCイベントのマップインターフェース
export type IPCEvents =Record<string, ReqRes<any, any>>;

export class IpcManager {
    // 型安全なリクエストハンドラ（Renderer -> Main）
    public static handleIPC<E extends IPCEvents=never,K extends keyof E=never>(
        channel:NoInfer<K>,
        handler: (
            event: Electron.IpcMainInvokeEvent,
            request: E[K]["request"],
        ) => Promise<E[K]["response"]> | E[K]["response"]
    ) {
        ipcMain.handle(channel as string, handler);
    }

    // 型安全なリクエスト送信（Renderer -> Main）
    public static async invokeIPC<E extends IPCEvents=never,K extends keyof E=never>(
        channel: NoInfer<K>,
        request: E[K]["request"]=undefined
    ): Promise<E[K]["response"]> {
        return ipcRenderer.invoke(channel as string, request);
    }

    // 型安全なリスナー削除（Main）
    public static removeAllListeners<
        E extends IPCEvents = never,
        K extends keyof E=never
    >(channel:NoInfer<K>) {
        ipcMain.removeAllListeners(channel as string);
    }

    // 型安全なイベントリスナー（Main -> Renderer）
    public static receiveFromMain<E extends IPCEvents = never,K extends keyof E=never>(
        channel: NoInfer<K>,
        listener: (event: Electron.IpcRendererEvent, request: E[K]["request"]) => void
    ) {
        ipcRenderer.on(channel as string, listener);
    }

    // 型安全なイベント送信（Main -> Renderer）
    public static sendToRenderer<E extends IPCEvents = never,K extends keyof E=never>(
        webContentId: number,
        channel: NoInfer<K>,
        request: E[K]["request"]=undefined
    ) {
        const target = webContents.fromId(webContentId);
        if (target) {
            target.send(channel as string, request);
        }
    }
}
