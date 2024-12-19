import {isNetConnected} from "./isNetConnected";
import EventEmitter2 from "eventemitter2";
import {clearInterval, setInterval} from "timers";

// ネットワークイベントの種類を定義
type NetWorkEvent = "change" | "connected" | "disconnected";

/**
 * NetWorkStatus クラス
 * ネットワークの接続状態を監視し、状態変化をイベントとして発火する
 */
export class NetWorkStatus {
    private event: EventEmitter2;
    private timerIDs: NodeJS.Timeout[] | undefined;  // 監視用タイマーIDのリスト
    private is_connected: boolean;  // 現在のネットワーク接続状態
    private status: "ON" | "OFF";  // チェックの有効/無効状態
    private listener_table: {
        [event_name: string]: { id: string; listener: (...args: any) => any }[];
    };  // 登録されたイベントリスナーの管理テーブル

    constructor() {
        this.event = new EventEmitter2();
        this.is_connected = false;
        this.status = "OFF";
        this.timerIDs = undefined;
        // 各イベントに対して空のリスナーリストを初期化
        this.listener_table = { change: [], connected: [], disconnected: [] };
    }

    /**
     * emitEvent メソッド
     * 指定されたイベントを発火し、必要に応じて状態を監視するタイマーを設定する
     * @param event_name ネットワークイベントの種類
     */
    private emitEvent(event_name: NetWorkEvent) {
        switch (event_name) {
            case "change": {
                // 定期的にネットワーク接続状態を確認し、変化があればイベントを発火
                const timer = setInterval(async () => {
                    const currentStatus = await isNetConnected();
                    if (currentStatus !== this.is_connected) {
                        this.is_connected = currentStatus;
                        // 状態が変化した場合に"change"イベントと、接続/切断イベントを発火
                        this.event.emit("change", this.is_connected);
                        this.event.emit(
                            this.is_connected ? "connected" : "disconnected",
                            this.is_connected
                        );
                    }
                }, 100);
                // タイマーIDをリストに追加
                this.timerIDs = this.timerIDs || [];
                this.timerIDs.push(timer);
                break;
            }
            case "connected": {
                // 接続状態であれば"connected"イベントを発火
                if (this.is_connected) {
                    this.event.emit("connected");
                }
                break;
            }
            case "disconnected": {
                // 切断状態であれば"disconnected"イベントを発火
                if (!this.is_connected) {
                    this.event.emit("disconnected");
                }
                break;
            }
        }
    }

    /**
     * on メソッド
     * ネットワーク状態の監視を開始する
     */
    public async on(): Promise<void> {
        this.status = "ON";
        this.is_connected = await isNetConnected();
        // 状態変化の監視を開始
        this.emitEvent("change");
    }

    /**
     * off メソッド
     * ネットワーク状態の監視を停止し、タイマーをクリアする
     */
    public async off(): Promise<void> {
        this.status = "OFF";
        if (this.timerIDs) {
            // 全てのタイマーを停止し、リストをクリア
            for (const id of this.timerIDs) {
                clearInterval(id);
            }
            this.timerIDs = undefined;
            this.is_connected = false;
        } else {
            throw "timerIDs is undefined";
        }
    }

    /**
     * getIsConnected メソッド
     * 現在の接続状態を返す
     * @returns boolean ネットワーク接続状態
     */
    public getIsConnected() {
        if (this.status === "ON") {
            return this.is_connected;
        } else {
            throw 'checker status is "OFF"';
        }
    }

    /**
     * addEvent メソッド
     * イベントリスナーを登録し、重複するIDがないかを確認する
     * @param event ネットワークイベントの種類
     * @param option リスナーIDとリスナー関数を含むオブジェクト
     */
    public addEvent(
        event: NetWorkEvent,
        option: { id: string; listener: (...args: any) => any }
    ) {
        // Setを利用してidの重複チェック
        const ids = [...new Set(this.listener_table[event].map((item) => item.id))];
        if (ids.length > 0 && ids.includes(option.id)) {
            throw "this id is already exist";
        }
        // リスナーをテーブルに追加し、イベントに登録
        this.listener_table[event].push(option);
        this.event.on(event, option.listener);
    }

    /**
     * removeEvent メソッド
     * 指定されたIDのリスナーを削除する
     * @param event ネットワークイベントの種類
     * @param id 削除対象のリスナーID
     */
    public removeEvent(event: NetWorkEvent, id: string) {
        // 指定IDのリスナーを検索
        const record = this.listener_table[event].find((r) => r.id === id);
        if (!record) return;
        // リスナーを削除し、イベントリスナーも解除
        this.listener_table[event] = this.listener_table[event].filter(
            (r) => r.id !== id
        );
        this.event.off(event, record.listener);
    }
}
