import {control as cl} from "../utils/control.js";
import {clearInterval} from "timers";

class WaitAccessMessage{
    constructor(max_quant,waitmsec) {
        this.max_dot_quant = max_quant;
        this.waitmsec = waitmsec;
        this.waitAccess = undefined;
    }
    //アクセスメッセージの開始
    async on(){
        //アクセス待機メッセージ
        process.stdout.write("アクセス中です");
        let dot_count = 0;
        this.waitAccess = setInterval(()=>{
            if (dot_count === this.max_dot_quant){
                process.stdout.write(`\x1b[${dot_count*2}D${cl.rightClear}`);
                dot_count=0;
            }else{
                process.stdout.write("・");
                dot_count++
            }
        },this.waitmsec);
        return this.waitAccess;
    }
    //アクセスメッセージの終了
    async off(){
        if (typeof this.waitAccess){
            process.stdout.write(`${cl.lineClear}${cl.initialLine()}`);
            clearInterval(this.waitAccess)
        }
    }
}
export default WaitAccessMessage;