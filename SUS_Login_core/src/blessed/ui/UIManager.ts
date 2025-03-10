// uiManager.ts - UIの管理を担当するクラス
import {Widgets} from "blessed";
import {DataFormatter} from "./DataFormatter";
import {ComponentFactory} from "./ComponentFactory";
import {EventService} from "./EventService";
import {SolaLinkData, User} from "../../main/setup";
import {FormattedData, NetworkState, UIComponents, UIConfig, UIState} from "./UITypes";

/**
 * デフォルトのUI設定
 */
const DEFAULT_CONFIG: UIConfig = {
    colors: {
        fg: "#ffffff",
        bg: "",
        border: {
            fg: "#df00ff",
            bg: "",
        },
        selected: {
            fg: "#ffffff",
            bg: "#29a682",
        },
        choice: {
            fg: "#ffffff",
            bg: "#ff0088",
        },
        focus: {
            border: {
                fg: "#00ffc4",
                bg: "",
            },
        },
    },
    position: {
        // row, col, rowSpan, colSpan
        net: [0, 8, 2, 12],
        info: [12, 0, 8, 20],
        choice: [10, 0, 2, 8],
        form: [10, 0, 2, 8],
        mainTree: [0, 0, 10, 8],
        subTree: [2, 8, 10, 12],
    },
};

/**
 * UIマネージャー
 * UIコンポーネントとその状態を管理するクラス
 */
export class UIManager {
    public components: UIComponents;
    public state: UIState;
    public network: NetworkState;
    public data: FormattedData;

    public config: UIConfig;
    public eventService: EventService;

    /**
     * コンストラクタ
     * @param user ユーザー情報
     * @param links SOLAリンクデータ
     * @param config UI設定（オプション）
     */
    constructor(user: User, links: SolaLinkData, config?: Partial<UIConfig>) {
        // 設定の初期化
        this.config = {...DEFAULT_CONFIG, ...(config || {})};

        // 状態の初期化
        this.state = {
            inputValue: "",
            focus: {bef: undefined, now: undefined},
            isChangeFocus: true,
        };

        this.network = {};

        // データの整形
        this.data = DataFormatter.format(user, links);

        // UIコンポーネントの作成
        const componentFactory = new ComponentFactory(this.config);
        this.components = componentFactory.createComponents(this.data.main, this.data.sub);

        // イベントサービスの初期化
        this.eventService = new EventService(this);
    }

    /**
     * アプリケーションを初期化する
     */
    public init(): void {
        try {
            // 最初はINFOをフォーカス
            if (!this.components.mainTree || !this.components.info) return;
            this.setFocus(this.components.mainTree);
            this.setFocus(this.components.info);

            // mainTree一番上の要素を選択
            this.components.mainTree.rows.emit("select item");

            // ネットワーク判定タイマーを作動
            this.eventService.emit("network", this);

            // 画面のレンダリング
            this.components.screen.render();
        } catch (e) {
            throw e;
        }
    }

    /**
     * フォーカスを設定する
     * @param tar フォーカス対象のコンポーネント
     */
    public setFocus(tar: Widgets.BlessedElement | void): void {
        if (!tar) return;

        // focusを切り替える関数
        const focuses = this.state.focus;
        const c = this.components;

        focuses.bef = this.state.focus.now; // 前フォーカスしてたコンポーネント
        focuses.now = tar; // これからフォーカスするコンポーネント

        // 2度目以降のフォーカスのときtrue
        if (focuses.bef) {
            // befの枠線色を初期値に戻す
            focuses.bef.style.border.fg = this.config.colors.border.fg;
            focuses.bef.style.border.bg = this.config.colors.border.bg;

            // formが選択されたときにchoiceとformを切り替える処理
            if (tar.name === "form" || focuses.bef.name === "form") {
                if (this.components.choice && this.components.form) {
                    this.components.choice.toggle();
                    this.components.form.toggle();
                }
            }
        }

        // nowの枠線色をfocus時のものに切り替え
        focuses.now.style.border.fg = this.config.colors.focus.border.fg;
        focuses.now.style.border.bg = this.config.colors.focus.border.bg;

        // tarをフォーカス
        tar.focus();

        // 画面のレンダリング
        c.screen.render();
    }

    /**
     * ネットワーク状態を変更する
     * @param cond ネットワーク状態
     */
    public changeNetStatus(cond: boolean): void {
        if (this.components?.net) {
            this.components.net.setContent(
                `接続状況：${cond ? "{green-bg}良好{/}" : "{red-bg}不良{/}"}`
            );
            this.components.screen.render();
        }
    }

    /**
     * 選択表示内容を設定する
     * @param contents 表示内容
     */
    public setChoice(contents: string): void {
        if (this.components?.choice) {
            this.components.choice.setContent(`{bold}${contents}{/}`);
            this.components.choice.render();
        }
    }

    /**
     * 情報表示内容を設定する
     * @param value 表示内容
     */
    public setInfo(value: string | undefined): void {
        if (!this.components.info || !value) return;

        this.components.info.resetScroll();
        this.components.info.setContent(value);
        this.components.screen.render();
    }

    /**
     * 情報表示をクリアする
     */
    public clearInfo(): void {
        if (!this.components.info) return;

        this.components.info.resetScroll();
        this.components.info.setContent("");
        this.components.screen.render();
    }

    /**
     * 情報表示に追加する
     * @param value 追加内容
     */
    public appendInfo(value: string): void {
        if (!this.components.info) return;

        const append = this.components.info.getContent() + value + "\n";
        this.setInfo(append);
        this.components.info.setScrollPerc(100);
        this.components.screen.render();
    }

    /**
     * 情報表示のラベルを変更する
     * @param value ラベル名
     */
    public changeInfoLabel(value = "INFO"): void {
        if (!this.components.info) return;

        this.setInfo("");
        this.components.info.setLabel(value);
        this.components.screen.render();
    }
}