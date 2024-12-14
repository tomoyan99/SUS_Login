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
  async consoleOn(prompt: string = "アクセス中...") {
    // this.spinner = ora({
    //   text: prompt,
    //   spinner: spinners.dots,
    // });
    //アクセス待機メッセージ
    this.wait_access = setInterval(() => {
      this.print_func(prompt);
      // this.print_func(`\x1b[2F\x1b[K${this.spinner?.frame()}`);
    }, this.wait_msec);
  }
  //アクセスメッセージの終了
  async consoleOff() {
    if (typeof this.wait_access) {
      clearInterval(this.wait_access);
      // this.print_func(this.spinner?.succeed());
    }
  }
}

export default WaitAccessMessage;