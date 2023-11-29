import {control as cl} from "../utils/control.js";
import {clearInterval} from "timers";

class WaitAccessMessage{
    constructor(waitmsec,func=console.log) {
        this.waitmsec = waitmsec;
        this.waitAccess = undefined;
        this.func = func;
    }
    //アクセスメッセージの開始
    async consoleOn(){
        //アクセス待機メッセージ
        this.waitAccess = setInterval(()=>{
            this.func("アクセス中...\n");
        },this.waitmsec);
        return this.waitAccess;
    }
    //アクセスメッセージの終了
    async consoleOff(){
        if (typeof this.waitAccess){
            clearInterval(this.waitAccess)
        }
    }
}
export default WaitAccessMessage;