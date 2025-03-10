// types.ts - 型定義をまとめたファイル
import {Widgets} from "blessed";
import contrib from "blessed-contrib";
import {User} from "./main/setup";

// ツリーノードの型定義
export type TreeNode = {
    extended?: boolean;
    children?: Record<string, TreeNode>;
    name?: string;
    code?: string;
    event?: string;
    [key: string]: any;
};

// イベントマップの型定義
export type TreeEventMap = {
    event?: string;
    url?: string;
    name?: string;
    code?: string;
    [key: string]: any;
};

// UIコンポーネントの型定義
export interface UIComponents {
    screen: Widgets.Screen;
    grid: contrib.grid;
    net: Widgets.TextElement | void;
    choice: Widgets.TextElement | void;
    info: Widgets.BoxElement | void;
    form: Widgets.TextboxElement | void;
    mainTree: contrib.widget.Tree | void;
    subTree: contrib.widget.Tree | void;
}

// UI状態の型定義
export interface UIState {
    inputValue: string;
    focus: {
        bef?: Widgets.BlessedElement;
        now?: Widgets.BlessedElement
    };
    isChangeFocus: boolean;
}

// ネットワーク状態の型定義
export interface NetworkState {
    id?: NodeJS.Timeout;
    status?: boolean;
}

// UI設定の型定義
export interface UIConfig {
    colors: {
        fg: string;
        bg: string;
        border: { fg: string; bg: string };
        selected: { fg: string; bg: string };
        choice: { fg: string; bg: string };
        focus: { border: { fg: string; bg: string } };
    };
    position: Record<string, [number, number, number, number]>;
}

// フォーマット済みデータの型定義
export interface FormattedData {
    user: User;
    main: TreeNode;
    sub: TreeNode;
    description: Record<string, string>;
}