import { isNetConnected } from "./isNetConnected";
import { clearInterval, setInterval } from "timers";
import { AdvancedEventEmitter } from "./AdvancedEventEmitter";

// NetWorkCheckerが発行するイベントの型マップ
interface NetWorkEventMap {
  change: boolean;
  connected: void;
  disconnected: void;
}

export class NetWorkStatus extends AdvancedEventEmitter<NetWorkEventMap> {
  private timerID: NodeJS.Timeout | null = null;
  private is_connected: boolean = false;
  private status: "ON" | "OFF" = "OFF";
  private listener_table: {
    [event_name: string]: { id: string; listener: (...args: any) => any }[];
  } = { change: [], connected: [], disconnected: [] };

  constructor() {
    super();
  }

  private async checkStatus() {
    const currentStatus = await isNetConnected();
    if (this.status === "ON" && currentStatus !== this.is_connected) {
      this.is_connected = currentStatus;
      this.emit("change", this.is_connected);
      this.emit(this.is_connected ? "connected" : "disconnected");
    }
  }

  /**
   * ネットワーク監視を開始します。
   */
  public async start(): Promise<void> {
    if (this.status === "ON") return;
    this.status = "ON";
    this.is_connected = await isNetConnected();
    this.timerID = setInterval(() => this.checkStatus(), 2000);
  }

  /**
   * ネットワーク監視を停止します。
   */
  public async stop(): Promise<void> {
    if (this.status === "OFF") return;
    this.status = "OFF";
    if (this.timerID) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    this.is_connected = false;
  }

  /**
   * イベントリスナーを登録します。
   */
  public addEvent<K extends keyof NetWorkEventMap>(event: K, option: { id: string; listener: (arg: NetWorkEventMap[K]) => void }) {
    if (!this.listener_table[event] || this.listener_table[event].some(l => l.id === option.id)) {
      if(this.listener_table[event]?.some(l => l.id === option.id)) console.warn(`[NetWorkStatus] Listener with id "${option.id}" already exists.`);
      return;
    }
    this.listener_table[event].push(option);
    // ここで呼び出している this.on は継承元の AdvancedEventEmitter.on メソッドです
    this.on(event, option.listener);
  }

  /**
   * イベントリスナーを削除します。
   */
  public removeEvent(event: keyof NetWorkEventMap, id: string) {
    const record = this.listener_table[event]?.find(r => r.id === id);
    if (!record) return;

    this.listener_table[event] = this.listener_table[event].filter(r => r.id !== id);
    // ここで呼び出す off も継承元のメソッドです
    this.off(event, record.listener);
  }
}
