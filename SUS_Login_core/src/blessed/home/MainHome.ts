import Blessed, {Widgets} from "blessed";
import contrib from "blessed-contrib";
import EventEmitter2 from "eventemitter2";
import {BlessedListener, ListenerList, listeners, OriginalListener} from "../listener/listeners";
import {description} from "../description/description";
import {mainEventMap} from "../commandList/commandList";
import {SolaLinkData, TreeEventMap, User} from "../../main/setup";

export type TreeNode = {
  extended?: boolean;
  children?: Record<string, TreeNode>;
  name?: string;
  code?: string;
  event?: string;
  [key: string]: any;
};

type MainArgs = { user: User; links: SolaLinkData };


class FormatData {
  data: {
    user: User;
    main: TreeNode;
    sub: TreeNode;
    description:Record<string,string>;
  };

  constructor(args: MainArgs) {
    args.links["{yellow-fg}戻る{/}"] = { event: "return" };
    this.data = {
      user: args.user,
      main: this.treeingEventMap(mainEventMap),
      sub : this.treeingEventMap(args.links),
      description: description,
    };
  }
  /**
   * @name treeingEventMap
   * @description EventMapデータをcontrib-tree用に整形する関数
   * */
  public treeingEventMap(EM:Record<string,TreeEventMap|TreeEventMap[]>, depth: number = 0): TreeNode {
    const except_keys = ["event", "url", "name", "code"];
    let EM_treed: TreeNode =
        depth === 0
            ? { extended: true, children: {} }
            : Object.keys(EM).length > 0
                ? { children: {} }
                : {};
    for (const EM_key in EM) {
      if (except_keys.includes(EM_key)) {
        EM_treed[EM_key] = EM[EM_key];
      } else {
        EM_treed.children![EM_key] = this.treeingEventMap(
            <Record<string,TreeEventMap>>EM[EM_key],
            depth + 1
        );
      }
    }
    return EM_treed;
  }
}

class Members extends FormatData {
  status: {
    inputValue: string;
    focus: { bef?: Widgets.BlessedElement; now?: Widgets.BlessedElement };
    isChangeFocus:boolean;
  };

  network: {
    id?: NodeJS.Timeout;
    status?: boolean;
  };

  readonly colors: {
    fg: string;
    bg: string;
    border: { fg: string; bg: string };
    selected: { fg: string; bg: string };
    choice: { fg: string; bg: string };
    focus: { border: { fg: string; bg: string } };
  }
  readonly position: Record<string, [number, number, number, number]>;
  constructor(args:MainArgs) {
    super(args);
    this.status = {
      inputValue: "",
      focus: {
        bef: undefined,
        now: undefined,
      },
      isChangeFocus: true,
    };
    this.network = {};
    this.colors = {
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
    };
    this.position = {
      // row: number, col: number, rowSpan: number, colSpan: number
      net: [0, 8, 2, 12],
      info: [12, 0, 8, 20],
      choice: [10, 0, 2, 8],
      form: [10, 0, 2, 8],
      mainTree: [0, 0, 10, 8],
      subTree: [2, 8, 10, 12],
    };
  }
}

class Components extends Members {

  public components:{
    screen  :Widgets.Screen,
    grid    :contrib.grid,
    net     :Widgets.TextElement,
    choice  :Widgets.TextElement,
    info    :Widgets.BoxElement,
    form    :Widgets.TextboxElement,
    mainTree:contrib.widget.Tree,
    subTree :contrib.widget.Tree
  }

  constructor(args:MainArgs) {
    super(args);
    const screen      = this.makeScreen();
    const grid          = this.makeGrid(screen);
    const net      = this.makeNet(grid);
    const choice   = this.makeChoice(grid);
    const info     = this.makeInfo(grid);
    const form  = this.makeForm(grid);
    const mainTree      = this.makeMainTree(screen,grid);
    const subTree       = this.makeSubTree(grid);
    this.components = {
      screen:screen,
      grid:grid,
      net:net,
      choice:choice,
      info:info,
      form:form,
      mainTree:mainTree,
      subTree:subTree
    }
  }

  private makeScreen():Widgets.Screen{
    // スクリーンを生成
    return Blessed.screen({
      smartCSR: true,
      fullUnicode: true, // ここを追加
      terminal: "xterm-256color",
      tabSize: 2,
    });
  }

  private makeGrid(screen:Widgets.Screen):contrib.grid {
    // 上で作ったスクリーンを縦横20分割して配置できるようになる
    return new contrib.grid({
      rows: 20,
      cols: 20,
      screen:screen,
    });
  }

  /**
   * @name makeNet
   * @description コンポーネントの作成(ネットワーク表示部)
   * */
  private makeNet(grid:contrib.grid):Widgets.TextElement {
    return grid.set(...this.position.net, Blessed.text, {
      keys: false, // キー入力
      parent: grid.screen, // 必ず指定
      name: "net",
      label: "NETWORK_STATUS", // 表示する名称
      align: "left",
      border: { type: "line" },
      style: {
        fg: this.colors.fg, // 通常時の文字色
        bg: this.colors.bg, // 通常時の背景色
        border: this.colors.border,
      },
      noCellBorders: true,
      tags: true, // 色付けする場合
      wrap: false,
    });
  }

  /**
   * @name makeChoice
   * @description コンポーネントの作成(選択表示部)
   * */
  private makeChoice(grid:contrib.grid):Widgets.TextElement {
    return grid.set(
        ...this.position.choice,
        Blessed.text,
        {
          keys: false, // キー入力
          parent: grid.screen, // 必ず指定
          name: "choice",
          label: "CHOICE", // 表示する名称
          align: "left",
          border: { type: "line" },
          style: {
            fg: this.colors.fg, // 通常時の文字色
            bg: this.colors.bg, // 通常時の背景色
            border: {
              fg: this.colors.border.fg,
              bg: this.colors.border.bg,
            },
          },
          tags: true, // 色付けする場合
          wrap: false,
        },
    );
  }

  /**
   * @name makeInfo
   * @description コンポーネントの作成(情報表示部)
   * */
  private makeInfo(grid:contrib.grid) {
    const info:Widgets.BoxElement = grid.set(...this.position.info, Blessed.text, <Widgets.TextOptions>{
      keys: true, // キー入力
      mouse: false,
      parent: grid.screen, // 必ず指定
      name: "info",
      scrollable: true,
      alwaysScroll: true,
      scrollbar: true,
      label: "INFO", // 表示する名称
      align: "left",
      border: { type: "line" },
      style: {
        fg: this.colors.fg, // 通常時の文字色
        bg: this.colors.bg, // 通常時の背景色
        border: {
          fg: this.colors.border.fg,
          bg: this.colors.border.bg,
        },
        scrollbar: { fg: "#000000", bg: "#ffffff" },
      },
      noCellBorders: true,
      tags: true, // 色付けする場合
      wrap: false,
    });
    info.key("down", () => {
      info.scroll(1);
    });
    info.key("up", () => {
      info.scroll(-1);
    });

    return info;
  }

  /**
   * @name makeForm
   * @description コンポーネントの作成(入力フォーム部)
   * */
  private makeForm(grid:contrib.grid):Widgets.TextboxElement {
    const form:Widgets.TextboxElement = grid.set(
        ...this.position.form,
        Blessed.textbox,
        {
          key: true,
          parent: grid.screen,
          name: "form",
          label: "INPUT_FORM",
          border: { type: "line" },
          inputOnFocus: true,
          style: {
            fg: "", // 通常時の文字色
            bg: "", // 通常時の背景色
            border: {
              fg: this.colors.border.fg,
              bg: this.colors.border.bg,
            },
          },
          tags: true,
        },
    );
    form.hide();
    return form;
  }

  /**
   * @name makeMainTree
   * @description コンポーネントの作成(コマンド選択部)
   * */
  private makeMainTree(screen:Widgets.Screen,grid:contrib.grid) {
    const mainTree:contrib.widget.Tree = grid.set(
        ...this.position.mainTree,
        contrib.tree,
        {
          key: true,
          parent:screen,
          keys: [],
          name: "mainTree",
          label: "COMMANDS",
          border: { type: "line" },
          style: {
            fg: this.colors.fg, // 通常時の文字色
            bg: this.colors.bg, // 通常時の背景色
            border: {
              //枠線の線色
              fg: this.colors.border.fg,
              //枠線の背景色
              bg: this.colors.border.bg,
            },
            selected: {
              //選択要素の文字色
              fg: this.colors.selected.fg,
              //選択要素の背景色
              bg: this.colors.selected.bg,
            },
          },
          tags: true,
        },
    );
    //データをセット
    mainTree.setData(this.data.main);
    return mainTree;
  }

  /**
   * @name makeSubTree
   * @description コンポーネントの作成(ページ選択部)
   * */
  private makeSubTree(grid:contrib.grid):contrib.widget.Tree {
    const subTree:contrib.widget.Tree = grid.set(
        ...this.position.subTree,
        contrib.tree,
        {
          key: true,
          parent: grid.screen,
          keys: [],
          name: "subTree",
          label: "PAGES",
          border: { type: "line" },
          style: {
            fg: this.colors.fg, // 通常時の文字色
            bg: this.colors.bg, // 通常時の背景色
            border: {
              fg: this.colors.border.fg,
              bg: this.colors.border.bg,
            },
            selected: {
              fg: this.colors.selected.fg,
              bg: this.colors.selected.bg,
            },
          },
          tags: true,
        },
    );
    return subTree;
  }
}

class Methods extends Components{
  constructor(args:MainArgs) {
    super(args);
  }
  /**
   * @name setFocus
   * @description フォーカスを切り替える関数
   * */
  public setFocus(tar:Widgets.BlessedElement) {
    const focuses = this.status.focus;
    const c = this.components;
    focuses.bef = this.status.focus.now; //前フォーカスしてたコンポーネント
    focuses.now = tar; //これからフォーカスするコンポーネント

    //2度目以降のフォーカスのときtrue
    if (focuses.bef) {
      //befの枠線色を初期値に戻す
      focuses.bef.style.border.fg = this.colors.border.fg;
      focuses.bef.style.border.bg = this.colors.border.bg;
      //formが選択されたときにchoiceとformを切り替える処理
      if (tar.name === "form" || focuses.bef.name === "form") {
        this.components.choice.toggle();
        this.components.form.toggle();
      }
    }
    //nowの枠線色をfocus時のものに切り替え
    focuses.now.style.border.fg = this.colors.focus.border.fg;
    focuses.now.style.border.bg = this.colors.focus.border.bg;
    //tarをフォーカス
    tar.focus();
    //画面のレンダリング
    c.screen.render();
  }
  public changeNetStatus(cond:boolean){
    this.components?.net?.setContent(
        `接続状況：${cond ? "{green-bg}良好{/}" : "{red-bg}不良{/}"}`,
    );
    this.components.screen.render();
  };
  public setChoice(contents:string){
    this.components.choice.setContent(`{bold}${contents}{/}`);
    this.components.choice.render();
  };
  public setInfo(value:string){
    this.components.info.resetScroll();
    this.components.info.setContent(value);
    this.components.screen.render();
  };
  public clearInfo(){
    this.components.info.resetScroll();
    this.components.info.setContent("");
    this.components.screen.render();
  };
  public appendInfo(value:string){
    const append = this.components.info.getContent() + value + "\n";
    this.setInfo(append);
    this.components.info.setScrollPerc(100);
    this.components.screen.render();
  };
  public changeInfoLabel(value = "INFO"){
    this.setInfo("");
    this.components.info.setLabel(value);
    this.components.screen.render();
  };
}

class MainHome extends Methods {
  public event = new EventEmitter2();
  public listeners:ListenerList;

  constructor(args:MainArgs) {
    try {
      //this.dataの作成
      super(args);
      this.listeners = this.onAllEvents();
    }catch (e:unknown) {
      throw e
    }
  }
  public init(){
    try{
      //最初はINFOをフォーカス
      this.setFocus(this.components.mainTree);
      this.setFocus(this.components.info);
      //mainTree一番上の要素を選択
      this.components.mainTree.rows.emit("select item");
      //ネットワーク判定タイマーを作動
      this.event.emit("network",this);
      //画面のレンダリング
      this.components.screen.render();
    }catch (e) {
      throw e;
    }
  }

  private setListenerList():ListenerList {
    return {
      blessed:listeners.blessed,
      original:listeners.original,
    }
  }

  private setBlessedEvents(blessedListener:BlessedListener) {
    const c = this.components;
    const l = blessedListener;
    //ツリーのイベントの設定
    for (const t of [c.mainTree, c.subTree]) {
      t.rows.on("select item", () => {
        l.treeSelect(this, t);
      });
      t.rows.key("enter", () => {
        l.treeEntered(this, t);
      });
      t.rows.key("right", () => {
        l.treeRight(this, t);
      });
      t.rows.key("left", () => {
        l.treeLeft(this, t);
      });
    }
    c.screen.on("resize", () => {
      console.clear();
    });
    c.screen.key("tab", () => {
      l.screenTab(this);
    });
    c.screen.key("space", () => {
      l.screenTab(this);
    });
    c.screen.key("escape", () => {
      l.screenEsc(this);
    });
    c.info.key("enter", () => {
      l.screenTab(this);
    });
    c.screen.key(["C-[", "C-c"], l.screenCtrC);
    c.form.on("focus", () => {
      c.form.on("keypress", (ch, key) => {
        const keyn = key.name;
        switch (keyn) {
          case "backspace":
            if (this.status.inputValue.length === 0) {
              c.form.setValue("入力 >>  ");
            } else {
              this.status.inputValue = this.status.inputValue.slice(0, -1);
            }
            break;
          case "escape":
            c.form.cancel();
            c.form.clearValue();
            this.setFocus(this.components.mainTree);
            break;
          case "enter":
            if (this.status.inputValue.length > 0) {
              c.form.submit();
              c.form.clearValue();
              this.setFocus(this.components.mainTree);
              this.setFocus(this.components.info);
            } else {
              c.form.cancel();
              c.form.clearValue();
              c.mainTree.rows.emit("select item");
              this.setFocus(this.components.mainTree);
            }
            break;
          case "return":
            break;
          default:
            //制御文字とバックスラッシュは除外
            if (key.sequence) {
              const cond =
                  key.sequence.charCodeAt(0) >= 33 &&
                  key.sequence.charCodeAt(0) <= 126 &&
                  key.sequence.charCodeAt(0) !== 92 &&
                  key.sequence.length === 1;
              if (cond) {
                this.status.inputValue += key.sequence;
              }
            } else {
              this.status.inputValue += key.ch;
            }
            break;
        }
      });
      c.form.setValue("入力 >> ");
      this.status.inputValue = "";
      this.components.screen.render();
    });
    c.form.on("blur", () => {
      c.form.removeAllListeners("keypress");
    });
  }

  private setOriginalEvents(originalListener:OriginalListener) {
    const e = this.event;
    const l = originalListener;
    e.on("appinfo", l.appInfo); //SUS_LOGIN(使用方法)
    e.on("euc", l.euc); //EUC
    e.on("sclass", l.sclass); //SCLASS
    e.on("sola", l.sola); //SOLA
    e.on("log", l.logs); //LOG
    e.on("image", l.images); //IMAGE
    e.on("completion", l.completion); //履修仮組みツール
    e.on("page", l.pageEnter); //SOLA_PAGE_LIST
    e.on("return", l.pageReturn); //SOLA_PAGE_LISTから戻る
    e.on("pagereload",l.pageReload); //SOLA_PAGE_LISTの更新
    e.on("quit", l.quit); //QUIT(閉じる)
    e.on("error", (e) => {
      l.error(this, e);
    }); // イベント内で発生したエラーを拾ってinfo内に表示
    e.on("network", l.network); //ネットワーク接続
  }

  private onAllEvents() {
    const listenerList = this.setListenerList();
    this.setBlessedEvents(listenerList.blessed);
    this.setOriginalEvents(listenerList.original);
    return listenerList;
  }
}

export default MainHome;
