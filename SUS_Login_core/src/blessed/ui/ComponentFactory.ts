// componentFactory.ts - UIコンポーネントを作成するファクトリー
import Blessed, {Widgets} from "blessed";
import contrib from "blessed-contrib";
import {TreeNode, UIComponents, UIConfig} from "./UITypes";

/**
 * コンポーネントファクトリー
 * UIコンポーネントを作成するためのファクトリークラス
 */
export class ComponentFactory {
    private config: UIConfig;

    /**
     * コンストラクタ
     * @param config UI設定
     */
    constructor(config: UIConfig) {
        this.config = config;
    }

    /**
     * すべてのUIコンポーネントを作成する
     * @param mainData メインツリーデータ
     * @param subData サブツリーデータ
     * @returns UIコンポーネント
     */
    public createComponents(mainData: TreeNode, subData: TreeNode): UIComponents {
        const screen = this.createScreen();
        const grid = this.createGrid(screen);

        return {
            screen,
            grid,
            net: this.createNet(grid),
            choice: this.createChoice(grid),
            info: this.createInfo(grid),
            form: this.createForm(grid),
            mainTree: this.createMainTree(screen, grid, mainData),
            subTree: this.createSubTree(grid, subData)
        };
    }

    /**
     * スクリーンを作成する
     */
    private createScreen(): Widgets.Screen {
        return Blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            terminal: "xterm-256color",
            tabSize: 2,
        });
    }

    /**
     * グリッドを作成する
     */
    private createGrid(screen: Widgets.Screen): contrib.grid {
        return new contrib.grid({
            rows: 20,
            cols: 20,
            screen: screen,
        });
    }

    /**
     * ネットワーク表示部を作成する
     */
    private createNet(grid: contrib.grid): Widgets.TextElement | void {
        if (!this.config.position.net) return;

        return grid.set(...this.config.position.net, Blessed.text, {
            keys: false,
            parent: grid.screen,
            name: "net",
            label: "NETWORK_STATUS",
            align: "left",
            border: {type: "line"},
            style: {
                fg: this.config.colors.fg,
                bg: this.config.colors.bg,
                border: this.config.colors.border,
            },
            noCellBorders: true,
            tags: true,
            wrap: false,
        });
    }

    /**
     * 選択表示部を作成する
     */
    private createChoice(grid: contrib.grid): Widgets.TextElement | void {
        if (!this.config.position.choice) return;

        return grid.set(...this.config.position.choice, Blessed.text, {
            keys: false,
            parent: grid.screen,
            name: "choice",
            label: "CHOICE",
            align: "left",
            border: {type: "line"},
            style: {
                fg: this.config.colors.fg,
                bg: this.config.colors.bg,
                border: {
                    fg: this.config.colors.border.fg,
                    bg: this.config.colors.border.bg,
                },
            },
            tags: true,
            wrap: false,
        });
    }

    /**
     * 情報表示部を作成する
     */
    private createInfo(grid: contrib.grid): Widgets.BoxElement | void {
        if (!this.config.position.info) return;
        const info: Widgets.BoxElement = grid.set(
            ...this.config.position.info,
            Blessed.text,
            <Widgets.TextOptions>{
                keys: true,
                mouse: false,
                parent: grid.screen,
                name: "info",
                scrollable: true,
                alwaysScroll: true,
                scrollbar: true,
                label: "INFO",
                align: "left",
                width:"50%",
                border: {type: "line"},
                style: {
                    fg: this.config.colors.fg,
                    bg: this.config.colors.bg,
                    border: {
                        fg: this.config.colors.border.fg,
                        bg: this.config.colors.border.bg,
                    },
                    scrollbar: {fg: "#000000", bg: "#ffffff"},
                },
                noCellBorders: true,
                tags: true,
                wrap: false,
            }
        );

        // スクロールのキーバインドを設定
        info.key("down", () => {
            info.scroll(1);
        });

        info.key("up", () => {
            info.scroll(-1);
        });

        return info;
    }

    /**
     * 入力フォームを作成する
     */
    private createForm(grid: contrib.grid): Widgets.TextboxElement | void {
        if (!this.config.position.form) return;
        const form: Widgets.TextboxElement = grid.set(
            ...this.config.position.form,
            Blessed.textbox,
            {
                key: true,
                parent: grid.screen,
                name: "form",
                label: "INPUT_FORM",
                border: {type: "line"},
                inputOnFocus: true,
                style: {
                    fg: "",
                    bg: "",
                    border: {
                        fg: this.config.colors.border.fg,
                        bg: this.config.colors.border.bg,
                    },
                },
                tags: true,
            }
        );

        // 初期状態は非表示
        form.hide();
        return form;
    }

    /**
     * メインツリーを作成する
     */
    private createMainTree(
        screen: Widgets.Screen,
        grid: contrib.grid,
        data: TreeNode
    ): contrib.widget.Tree | void {
        if (!this.config.position.mainTree) return;
        const mainTree: contrib.widget.Tree = grid.set(
            ...this.config.position.mainTree,
            contrib.tree,
            {
                key: true,
                parent: screen,
                keys: [],
                name: "mainTree",
                label: "COMMANDS",
                border: {type: "line"},
                style: {
                    fg: this.config.colors.fg,
                    bg: this.config.colors.bg,
                    border: {
                        fg: this.config.colors.border.fg,
                        bg: this.config.colors.border.bg,
                    },
                    selected: {
                        fg: this.config.colors.selected.fg,
                        bg: this.config.colors.selected.bg,
                    },
                },
                tags: true,
            }
        );

        // データをセット
        mainTree.setData(data);
        return mainTree;
    }

    /**
     * サブツリーを作成する
     */
    private createSubTree(grid: contrib.grid, data: TreeNode): contrib.widget.Tree | void {
        if (!this.config.position.subTree) return;
        const subTree: contrib.widget.Tree = grid.set(
            ...this.config.position.subTree,
            contrib.tree,
            {
                key: true,
                parent: grid.screen,
                keys: [],
                name: "subTree",
                label: "PAGES",
                border: {type: "line"},
                style: {
                    fg: this.config.colors.fg,
                    bg: this.config.colors.bg,
                    border: {
                        fg: this.config.colors.border.fg,
                        bg: this.config.colors.border.bg,
                    },
                    selected: {
                        fg: this.config.colors.selected.fg,
                        bg: this.config.colors.selected.bg,
                    },
                },
                tags: true,
            }
        );

        // データをセット
        subTree.setData(data);
        subTree.setData({});
        return subTree;
    }
}