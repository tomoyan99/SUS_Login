import {ipcMain, ipcRenderer} from "electron";
import {IPCEvents} from "../config/IpcEvents";

export class IpcManager {
    // 型安全なhandleメソッド
    public static handleIPC<K extends keyof IPCEvents>(
        event: K,
        handler: (event: Electron.IpcMainInvokeEvent, arg: IPCEvents[K]["request"])
            => Promise<IPCEvents[K]["response"]> | IPCEvents[K]["response"]
    ){
        ipcMain.handle(event, handler);
    };
    // 型安全な invoke メソッド
    public static async invokeIPC<K extends keyof IPCEvents>(
        event: K,
        arg?: IPCEvents[K]["request"]
    ): Promise<IPCEvents[K]["response"]>{
        return ipcRenderer.invoke(event,arg);
    };
    public static removeAllIPC<K extends keyof IPCEvents>(channel:K){
        ipcMain.removeAllListeners(channel);
    }
}