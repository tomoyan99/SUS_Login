import { clearInterval } from "timers";

process.stdout.setEncoding("utf8");

class WaitAccessMessage {
  private readonly wait_msec: number;
  private wait_access: NodeJS.Timeout|undefined;
  private readonly print_func: Function;

  constructor(wait_msec: number, func: Function = console.log) {
    this.wait_msec = wait_msec;
    this.wait_access = undefined;
    this.print_func = func;
  }

  //アクセスメッセージの開始
  async consoleOn(prompt: string = "アクセス中...") {
    //アクセス待機メッセージ
    this.wait_access = setInterval(() => {
      this.print_func(prompt);
    }, this.wait_msec);
    return this.wait_access;
  }

  //アクセスメッセージの終了
  async consoleOff() {
    if (typeof this.wait_access) {
      clearInterval(this.wait_access);
    }
  }
}

export default WaitAccessMessage;