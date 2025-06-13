import { AdvancedEventEmitter } from "./AdvancedEventEmitter";

// StdoutCaptureが発行するイベントの型マップ
interface StdoutEventMap {
  data: string;
}

export class StdoutCapture extends AdvancedEventEmitter<StdoutEventMap> {
  private originalWrite: typeof process.stdout.write;
  private output: string = "";

  constructor() {
    super();
    this.originalWrite = process.stdout.write;
  }

  startCapturing(): void {
    this.output = "";
    process.stdout.write = (str: string | Buffer): boolean => {
      const stringVal = str.toString();
      this.output += stringVal;
      this.emit("data", stringVal);
      return true;
    };
  }

  stopCapturing(): string {
    process.stdout.write = this.originalWrite;
    return this.output;
  }

  getCapturedOutput(): string {
    return this.output;
  }
}
