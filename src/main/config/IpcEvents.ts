import viewConfig from "../config/viewConfig";
import {ITerminalOptions} from "xterm";
import {IPCEvents, ReqRes} from "../managers/IpcManager";

type ViewConfig = typeof viewConfig;

// IPC イベントとその型情報を定義
export interface MyIPCEvents extends IPCEvents {
    "getViewConfig":ReqRes<void,ViewConfig>;
    "terminal.keystroke":ReqRes<{key:string},void>;
    "terminal.resize":ReqRes<{resizer:[number,number]},void>;
    "terminal.incomingData":ReqRes<string,void>;
    "terminal.fontsize":ReqRes<number | 'default',void>;
    "terminal.requestOptions":ReqRes<void,void>;
    "terminal.sendOptions":ReqRes<ITerminalOptions,void>;
}