import {isNetConnected} from "./isNetConnected";
import EventEmitter2 from "eventemitter2";
import {clearInterval} from "timers";

type NetWorkEvent="change"|"connected"|"disconnected"

export class NetWorkStatus{
    private event:EventEmitter2;
    private timerIDs :NodeJS.Timeout[]|undefined;
    private is_connected : boolean;
    private status : "ON"|"OFF";
    private listener_table :{
        [event_name:string]:({id:string,listener:(...args:any)=>any})[];
    }
    constructor() {
        this.event = new EventEmitter2();
        this.is_connected = false;
        this.status = "OFF";
        this.timerIDs = undefined;
        this.listener_table = {};
    }
    private emitEvent(event_name:NetWorkEvent){
        switch (event_name) {
            case "change":{
                const timer = setInterval(,)
                this.timerIDs
                break;
            }
            case "connected":{
                break;
            }
            case "disconnected":{
                break;
            }
        }
    }
    public async on():Promise<void>{
        this.status = "ON";
        this.is_connected = await isNetConnected();
        const timer = setInterval(async()=>{
            this.is_connected = await isNetConnected();
        },100);
        this.timerIDs?.push(timer);
    }
    public async off():Promise<void>{
        this.status = "OFF";
        if (this.timerIDs){
            for (const id of this.timerIDs) {
                clearInterval(id);
            }
            this.timerIDs = undefined;
            this.is_connected = false;
        }else{
            throw "timerIDs is undefined";
        }
    }
    public getIsConnected(){
        if (this.status === "ON"){
            return this.is_connected;
        }else{
            throw "checker status is \"OFF\"";
        }
    }
    public addEvent(event:NetWorkEvent,option:{id:string,listener:(...args:any)=>any}){
        // Setを利用してidの値を重複なく取得する
        const ids = [...new Set(this.listener_table[event].map(item => item.id))];
        // idに重複が無いように
        //　あったらエラー
        if (ids.length > 0 && ids.includes(option.id)){
            throw "this id is already exist";
        }
        this.listener_table[event].push(option);
        this.event.on(event,option.listener);
    }
    public removeEvent(event:NetWorkEvent,id:string){
        // idを持つレコードを取得
        const record =this.listener_table[event].filter((r)=>r.id === id)[0];
        // idが一致しないものを残すことでidを含むobjectレコードを削除
        this.listener_table[event] = this.listener_table[event].filter((r)=>r.id !== id);
        this.event.off(event,record.listener);
    }
}