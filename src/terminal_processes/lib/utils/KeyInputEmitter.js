import EventEmitter from "events";
import readline from "readline";
import {isNumberInRange} from "./myUtils.js";
import {control} from "./control.js";

export class KeyInputEmitter extends EventEmitter {
    rl = {}
    constructor() {
        super();
        this.init();
    }
    init() {
        // 標準入力の設定
        this.rl = readline.createInterface({
            input: process.stdin,
            output:process.stdout
        });
        const exitKeyList = ["\x03"];
        this.rl.input.on('keypress', (char, key) => {
            process.stdout.write(control.nowrite)
            // キー入力を受け取った時の処理
            this.emit("keypress",char,key);
            //終了処理したいときの処理
            if (exitKeyList.includes(key.sequence)){
                process.exit(0);
            }
            //エンターキーを押した処理
            if (key.name === "return"){
                this.rl.close();
                this.emit("enter",char,key);
            }
            //制御文字などを省いたキー
            if(isNumberInRange(key.sequence.charCodeAt(0),33,126) &&
                key.sequence.charCodeAt(0) !== 92){
                process.stdout.write(control.nowrite);
                this.emit("basic-key",char,key);
            }
            //backspaceを押した処理
            if (key.name === "backspace"){
                this.emit("backspace",char,key);
            }
        });
        // キー入力をリッスン
        this.rl.input.setRawMode(true);
        this.rl.resume();
    }
    exit(){
        this.rl.input.removeAllListeners("keypress");
        this.rl.close();
        // this.rl.input.setRawMode(false);
    }
}
