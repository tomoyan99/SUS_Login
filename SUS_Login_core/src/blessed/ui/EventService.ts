// eventService.ts - イベント関連の処理を行うサービス
import EventEmitter2 from "eventemitter2";
import {ListenerList, listeners} from "../listener/listeners";
import {UIManager} from "./UIManager";

/**
 * イベントサービス
 * アプリケーションのイベント処理を担当するクラス
 */
export class EventService {
    private emitter: EventEmitter2;
    public listeners: ListenerList;
    private readonly uiManager: UIManager;
    /**
     * コンストラクタ
     * @param uiManager UIマネージャー
     */
    constructor(uiManager: UIManager) {
        this.uiManager = uiManager;
        this.emitter = new EventEmitter2();
        this.listeners = this.initListeners();
        this.setupBlessedEvents();
        this.setupOriginalEvents();
    }

    /**
     * リスナーをラップしてエラーを捕捉し、errorイベントへ送出する
     * @param listener リスナー関数
     */
    private detectError(listener: (...args: any[]) => any): (...args: any[]) => void {
        return (...args: any[]) => {
            try {
                const result = listener(...args);
                // 非同期関数であればcatchでエラー捕捉
                if (result instanceof Promise) {
                    result.catch((e) => this.emit('error', e));
                }
            } catch (e) {
                this.emit('error', e);
            }
        };
    }

    /**
     * イベントリスナーを登録する
     * @param event イベント名
     * @param listener リスナー関数
     */
    public on(event: string, listener: (...args: any[]) => void): void {
        this.emitter.on(event, this.detectError(listener));
    }

    /**
     * イベントリスナー(一回きり)を登録する
     * @param event イベント名
     * @param listener リスナー関数
     */
    public once(event: string, listener: (...args: any[]) => void): void {
        this.emitter.once(event, this.detectError(listener));
    }

    /**
     * イベントを発火する
     * @param event イベント名
     * @param args イベント引数
     */
    public emit(event: string, ...args: any[]): void {
        this.emitter.emit(event, ...args);
    }

    /**
     * イベントのリスナーを全て削除
     * @param event イベント名
     */
    public removeAllListeners(event: string): void {
        this.emitter.removeAllListeners(event);
    }


    /**
     * リスナーを初期化する
     */
    private initListeners(): ListenerList {
        return {
            blessed: listeners.blessed,
            original: listeners.original
        };
    }

    /**
     * Blessedのイベントを設定する
     */
    private setupBlessedEvents(): void {
        const {components} = this.uiManager;
        const l = this.listeners.blessed;

        // ツリーのイベント設定
        for (const t of [components.mainTree, components.subTree]) {
            if (!t || !this.uiManager) continue;

            t.rows.on("select item", () => {
                l.treeSelect(this.uiManager, t);
            });

            t.rows.key("enter", () => {
                l.treeEntered(this.uiManager, t);
            });

            t.rows.key("right", () => {
                l.treeRight(this.uiManager, t);
            });

            t.rows.key("left", () => {
                l.treeLeft(this.uiManager, t);
            });
        }

        // スクリーンのイベント設定
        components.screen.on("resize", () => {
            console.clear();
        });

        components.screen.key("tab", () => {
            l.screenTab(this.uiManager);
        });

        components.screen.key("space", () => {
            l.screenTab(this.uiManager);
        });

        components.screen.key("escape", () => {
            l.screenEsc(this.uiManager);
        });

        components.info?.key("enter", () => {
            l.screenTab(this.uiManager);
        });

        components.screen.key(["C-[", "C-c"], l.screenCtrC);

        // フォームのイベント設定
        this.setupFormEvents();
    }

    /**
     * フォームのイベントを設定する
     */
    private setupFormEvents(): void {
        const {components} = this.uiManager;
        const c = components;

        if (!c.form) return;

        c.form.on("focus", () => {
            if (!c.form) return;

            c.form.on("keypress", (ch, key) => {
                if (!c.form) return;
                if (!this.uiManager.components.mainTree ||
                    !this.uiManager.components.info) return;
                const keyn = key.name;
                switch (keyn) {
                    case "backspace":
                        if (this.uiManager.state.inputValue.length === 0) {
                            c.form.setValue("入力 >>  ");
                        } else {
                            this.uiManager.state.inputValue = this.uiManager.state.inputValue.slice(0, -1);
                        }
                        break;
                    case "escape":
                        c.form.cancel();
                        c.form.clearValue();
                        this.uiManager.setFocus(this.uiManager.components.mainTree);
                        break;
                    case "enter":
                        if (this.uiManager.state.inputValue.length > 0) {
                            c.form.submit();
                            c.form.clearValue();
                            this.uiManager.setFocus(this.uiManager.components.mainTree);
                            this.uiManager.setFocus(this.uiManager.components.info);
                        } else {
                            c.form.cancel();
                            c.form.clearValue();
                            c.mainTree?.rows.emit("select item");
                            this.uiManager.setFocus(this.uiManager.components.mainTree);
                        }
                        break;
                    case "return":
                        break;
                    default:
                        // 制御文字とバックスラッシュは除外
                        if (key.sequence) {
                            const cond =
                                key.sequence.charCodeAt(0) >= 33 &&
                                key.sequence.charCodeAt(0) <= 126 &&
                                key.sequence.charCodeAt(0) !== 92 &&
                                key.sequence.length === 1;
                            if (cond) {
                                this.uiManager.state.inputValue += key.sequence;
                            }
                        } else {
                            this.uiManager.state.inputValue += key.ch;
                        }
                        break;
                }
            });

            c.form.setValue("入力 >> ");
            this.uiManager.state.inputValue = "";
            this.uiManager.components.screen.render();
        });

        c.form.on("blur", () => {
            if (!c.form) return;
            c.form.removeAllListeners("keypress");
        });
    }

    /**
     * オリジナルイベントを設定する
     */
    private setupOriginalEvents(): void {
        const l = this.listeners.original;

        this.on("appinfo", l.appInfo);
        this.on("euc", l.euc);
        this.on("sclass", l.sclass);
        this.on("sola", l.sola);
        this.on("log", l.logs);
        this.on("image", l.images);
        this.on("completion", l.completion);
        this.on("page", l.pageEnter);
        this.on("return", l.pageReturn);
        this.on("pagereload", l.pageReload);
        this.on("quit", l.quit);
        this.on("error", (e) => {
            l.error(this.uiManager, e);
        });
        this.on("network", l.network);
    }
}