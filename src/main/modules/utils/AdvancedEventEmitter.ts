import { EventEmitter2, Listener } from "eventemitter2";

// EventEmitter2を拡張して型安全にする汎用クラス
export class AdvancedEventEmitter<Events extends Record<string, any>> extends EventEmitter2 {
  emit<K extends Extract<keyof Events, string>>(
    event: K,
    // 引数がない(void)場合は引数なし、ある場合は必須にする
    ...args: Events[K] extends void ? [] : [Events[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends Extract<keyof Events, string>>(
    event: K,
    listener: (arg: Events[K]) => void,
  ): this | Listener {
    // EventEmitter2のリスナー型にキャストする
    return super.on(event, listener as (...args: any[]) => void);
  }

  once<K extends Extract<keyof Events, string>>(
    event: K,
    listener: (arg: Events[K]) => void,
  ): this | Listener {
    return super.once(event, listener as (...args: any[]) => void);
  }

  off<K extends Extract<keyof Events, string>>(
    event: K,
    listener: (arg: Events[K]) => void,
  ) {
    return super.off(event, listener as (...args: any[]) => void);
  }
}
