import viewConfig from "../config/viewConfig";

type ViewConfig = typeof viewConfig;

export interface ReqRes<T,U>{
    request:T,
    response:U
}

// IPC イベントとその型情報を定義
export interface IPCEvents {
    "getViewConfig":ReqRes<void,ViewConfig>;
    "terminal.keystroke":ReqRes<{key:string},void>;
    "terminal.resize":ReqRes<{resizer:number[]},void>;
}