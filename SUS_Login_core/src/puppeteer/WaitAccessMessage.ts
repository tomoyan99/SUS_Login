import {clearInterval} from "timers";
import {Ora} from "ora";

class WaitAccessMessage {
  private readonly wait_msec: number;
  private wait_access: NodeJS.Timeout|undefined;
  private readonly print_func: Function;
  private spinner : Ora|undefined;

  constructor(wait_msec: number, func: Function = console.log) {
    process.stdout.setEncoding("utf8");
    this.wait_msec = wait_msec;
    this.wait_access = undefined;
    this.print_func = func;
  }
  //アクセスメッセージの開始
  consoleOn(prompt: string = "アクセス中...") {
    //アクセス待機メッセージ
    this.wait_access = setInterval(() => {
      this.print_func(prompt);
    }, this.wait_msec);
  }
  //アクセスメッセージの終了
  consoleOff() {
    if (typeof this.wait_access) {
      clearInterval(this.wait_access);
    }
  }
}

export default WaitAccessMessage;