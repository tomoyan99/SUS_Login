"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timers_1 = require("timers");
process.stdout.setEncoding("utf8");
class WaitAccessMessage {
    wait_msec;
    wait_access;
    print_func;
    constructor(wait_msec, func = console.log) {
        this.wait_msec = wait_msec;
        this.wait_access = undefined;
        this.print_func = func;
    }
    //アクセスメッセージの開始
    async consoleOn(prompt = "アクセス中...") {
        //アクセス待機メッセージ
        this.wait_access = setInterval(() => {
            this.print_func(prompt);
        }, this.wait_msec);
        return this.wait_access;
    }
    //アクセスメッセージの終了
    async consoleOff() {
        if (typeof this.wait_access) {
            (0, timers_1.clearInterval)(this.wait_access);
        }
    }
}
exports.default = WaitAccessMessage;
//# sourceMappingURL=WaitAccessMessage.js.map