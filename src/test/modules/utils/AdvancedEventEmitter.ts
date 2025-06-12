import { EventEmitter2, Listener } from "eventemitter2";

// イベント名と引数を定義するEventMapインターフェース
interface EventMap {
  start: { time: Date }; // "start"イベントは引数としてDate型の`time`プロパティを持つオブジェクトを受け取る
  data: { value: number }; // "data"イベントは引数としてnumber型の`value`プロパティを持つオブジェクトを受け取る
  end: void; // "end"イベントは引数を取らない
}

// EventEmitter2を拡張して型安全にする
class AdvancedEventEmitter<Events extends Record<string, any>> extends EventEmitter2 {
  emit<K extends Extract<keyof Events, string>>(
    event: K,
    ...args: Events[K] extends void ? [] : [Events[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends Extract<keyof Events, string>>(
    event: K,
    listener: (arg: Events[K]) => void,
  ): this | Listener {
    return super.on(event, listener);
  }

  once<K extends Extract<keyof Events, string>>(
    event: K,
    listener: (arg: Events[K]) => void,
  ): this | Listener {
    return super.once(event, listener);
  }

  off<K extends Extract<keyof Events, string>>(event: K, listener: (arg: Events[K]) => void) {
    return super.off(event, listener);
  }
}
