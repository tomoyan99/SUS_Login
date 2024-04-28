import Blessed from "neo-blessed";
import contrib from "neo-blessed-contrib";
import EventEmitter from "events";
import {listeners} from "../listener/listeners.js";
import {description} from "../description/description.js";
import {mainCommandList} from "../commandList/commandList.js";

class FormatData{
    _data = {
        user:{},
        main:{},
        sub :{},
        description:{}
    }
    /**
     * @param {Object} args
     * @param {Object} args.main
     * @param {Object} args.sub
     * */
    constructor(args) {
        this._data.user = args[0];
        this._data.main = this._parseListData(mainCommandList);
        args[1]["{yellow-fg}戻る{/}"] = { event: "return" };
        this._data.sub  = this._parseListData(args[1]);
        this._data.description = description;
    }
    /**
     * @name parseListData
     * @param {Object} data 入力データ
     * @param {Number} depth 階層
     * @description データをcontrib-tree用に整形する関数
     * */
    _parseListData(data, depth = 0) {
        const except_keys = ["event", "url", "name","code"]
        let edited_data = (depth === 0)
            ? {extended: true, children: {}}
            : (Object.keys(data).length > 0)
                ? {children: {}}
                : {};
        for (const dataKey in data) {
            if (except_keys.includes(dataKey)) {
                edited_data[dataKey] = data[dataKey];
            } else {
                edited_data.children[dataKey] = this._parseListData(data[dataKey], depth + 1);
            }
        }
        return edited_data;
    }
}
class Members extends FormatData{
    status={
        inputValue:"",
        focus:{
            bef:undefined,
            now:undefined
        },
        miss_count:0
    }
    network={
        id:undefined,
        status:undefined
    }
    colors={
        fg:"#ffffff",
        bg:"",
        border:{
            fg:"#df00ff",
            bg:""
        },
        selected:{
            fg:"#ffffff",
            bg:"#29a682",
        },
        choice:{
            fg:"#ffffff",
            bg:"#ff0088"
        },
        focus:{
            border:{
                fg:"#00ffc4",
                bg:"",
            }
        }
    }
    //縦位置,横位置,縦幅,横幅
    position = {
        "net"     :[ 0,10, 2,10],
        "info"    :[12, 0, 8,20],
        "choice"  :[10, 0, 2,10],
        "form"    :[10, 0, 2,10],
        "mainTree":[ 0, 0,10,10],
        "subTree" :[ 2,10,10,10],
    }
    //コンポーネント管理
    components = {
        "screen":{},
        "grid":{},
        "net":{},
        "info":{},
        "choice":{},
        "form":{},
        "mainTree":{},
        "subTree":{},
    }
    constructor(args) {
        super(args);
    }
}
class SetComponents extends Members{
    constructor(args) {
        super(args);
        this.#makeGrid();
        this.#makeNet();
        this.#makeChoice()
        this.#makeInfo();
        this.#makeMainTree()
        this.#makeSubTree();
        this.#makeForm();
    }
    /**
     * @name setFocus
     * @param tar target
     * @description フォーカスを切り替える関数
     * */
    setFocus(tar){
        const focuses = this.status.focus;
        const c = this.components;
        focuses.bef = this.status.focus.now;//前フォーカスしてたコンポーネント
        focuses.now = tar;//これからフォーカスするコンポーネント

        //2度目以降のフォーカスのときtrue
        if (focuses.bef) {
            //befの枠線色を初期値に戻す
            focuses.bef.style.border.fg = this.colors.border.fg;
            focuses.bef.style.border.bg = this.colors.border.bg;
            //formが選択されたときにchoiceとformを切り替える処理
            if (tar.name === "form" || focuses.bef.name === "form"){
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
    #makeGrid(){
        // スクリーンを生成
        this.components.screen = Blessed.screen({
            smartCSR: true,
            fullUnicode: true, // ここを追加
            terminal:"xterm-256color",
            tabSize:2,
        })
        // 上で作ったスクリーンを縦横20分割して配置できるようになる
        this.components.grid = new contrib.grid({
            rows: 20,
            cols: 20,
            screen:this.components.screen,
        })
    }
    /**
     * @name makeNet
     * @description コンポーネントの作成(ネットワーク表示部)
     * */
    #makeNet(){
        const net = this.components.grid.set(...this.position.net, Blessed.text, {
            keys: false, // キー入力
            parent: this.components.screen, // 必ず指定
            name: "net",
            label: 'NETWORK_STATUS', // 表示する名称
            align: 'left',
            border: {type: 'line'},
            style: {
                fg: this.colors.fg, // 通常時の文字色
                bg: this.colors.bg, // 通常時の背景色
                border: this.colors.border,
            },
            noCellBorders: true,
            tags: true, // 色付けする場合
            wrap: false,
        });
        this.components.net = net;
        this.changeNetStatus = (cond)=>{
            net.setContent(`接続状況：${(cond)?"{green-bg}良好{/}":"{red-bg}不良{/}"}`);
            this.components.screen.render();
        }

    }
    /**
     * @name makeChoice
     * @description コンポーネントの作成(選択表示部)
     * */
    #makeChoice(){
        this.components.choice = this.components.grid.set(...this.position.choice, Blessed.text, {
            keys: false, // キー入力
            parent: this.components.screen, // 必ず指定
            name: "choice",
            label: 'CHOICE', // 表示する名称
            align: 'left',
            border: {type: 'line'},
            style: {
                fg: this.colors.fg, // 通常時の文字色
                bg: this.colors.bg, // 通常時の背景色
                border: {
                    fg: this.colors.border.fg,
                    bg: this.colors.border.bg
                },
            },
            tags: true, // 色付けする場合
            wrap: false,
        });
        this.setChoice = (contents)=>{
            this.components.choice.setContent(`{bold}${contents}{/}`);
            this.components.choice.render();
        }
    }
    /**
     * @name makeInfo
     * @description コンポーネントの作成(情報表示部)
     * */
    #makeInfo(){
        const info = this.components.grid.set(...this.position.info, Blessed.text, {
            keys: true, // キー入力
            mouse:false,
            parent: this.components.screen, // 必ず指定
            name:"info",
            scrollable:true,
            alwaysScroll:true,
            scrollbar:true,
            label: 'INFO', // 表示する名称
            align: 'left',
            border: { type: 'line' },
            style: {
                fg: this.colors.fg, // 通常時の文字色
                bg: this.colors.bg, // 通常時の背景色
                border: {
                    fg:this.colors.border.fg,
                    bg:this.colors.border.bg
                },
                scrollbar:{fg:"#000000", bg:"#ffffff",},
            },
            noCellBorders: true,
            tags: true, // 色付けする場合
            wrap: false,
        });
        info.key("down",()=>{
            info.scroll(1);
        })
        info.key("up",()=>{
            info.scroll(-1);
        })

        this.setInfo = (value)=>{
            info.resetScroll();
            info.setContent(value);
            this.components.screen.render();
        }
        this.appendInfo = (value)=>{
            const append = info.getContent()+value+"\n";
            this.setInfo(append);
            info.setScrollPerc(100);
            this.components.screen.render();
        }
        this.changeInfoLabel = (value = "INFO")=>{
            this.setInfo("");
            info.setLabel(value);
            this.components.screen.render();
        }
        this.components.info = info;
    }
    /**
     * @name makeForm
     * @description コンポーネントの作成(入力フォーム部)
     * */
    #makeForm(){
        const form = this.components.grid.set(...this.position.form,Blessed.textbox,{
            key:true,
            parent: this.components.screen,
            name: "form",
            label: "INPUT_FORM",
            border: {type: 'line'},
            inputOnFocus:true,
            style: {
                fg: "", // 通常時の文字色
                bg: "", // 通常時の背景色
                border: {
                    fg:this.colors.border.fg,
                    bg:this.colors.border.bg
                },
            },
            tags: true
        });
        form.hide();
        this.components.form = form;
    }

    /**
     * @name makeMainTree
     * @description コンポーネントの作成(コマンド選択部)
     * */
    #makeMainTree(){
        const main = this.components.grid.set(...this.position.mainTree,contrib.tree,{
            key:true,
            parent:this.components.screen,
            keys:[],
            name:"mainTree",
            label:"COMMANDS",
            border: { type: 'line' },
            style: {
                fg: this.colors.fg, // 通常時の文字色
                bg: this.colors.bg, // 通常時の背景色
                border: {
                    //枠線の線色
                    fg:this.colors.border.fg,
                    //枠線の背景色
                    bg:this.colors.border.bg
                },
                selected:{
                    //選択要素の文字色
                    fg:this.colors.selected.fg,
                    //選択要素の背景色
                    bg:this.colors.selected.bg,
                },
            },
            tags:true
        });
        //データをセット
        main.setData(this._data.main);
        this.components.mainTree = main;
    }
    /**
     * @name makeSubTree
     * @description コンポーネントの作成(ページ選択部)
     * */
    #makeSubTree(){
        this.components.subTree = this.components.grid.set(...this.position.subTree, contrib.tree, {
            key: true,
            parent: this.components.screen,
            keys: [],
            name: "subTree",
            label: "PAGES",
            border: {type: 'line'},
            style: {
                fg: this.colors.fg, // 通常時の文字色
                bg: this.colors.bg, // 通常時の背景色
                border: {
                    fg: this.colors.border.fg,
                    bg: this.colors.border.bg
                },
                selected: {fg: this.colors.selected.fg, bg: this.colors.selected.bg,}
            },
            tags: true
        });
    }
}
class MainHome extends SetComponents{
    event = new EventEmitter();
    listeners = {
        original: {},
        blessed:{}
    };
    constructor(args) {
        //this._dataの作成
        super(args);
        this.#onAllEvents();
        //最初はINFOをフォーカス
        this.setFocus(this.components.mainTree);
        this.setFocus(this.components.info);
        //mainTree一番上の要素を選択
        this.components.mainTree.rows.emit("select item");
        //ネットワーク判定タイマーを作動
        this.event.emit("network",this);
        //画面のレンダリング
        this.components.screen.render();
    }
    #setListnerList(){
        const l = this.listeners;
        l.original = listeners.original;
        l.blessed  = listeners.blessed;
    }
    #setBlessedEvents(){
        const c = this.components;
        const l = this.listeners.blessed;
        //ツリーのイベントの設定
        for (const t of [c.mainTree,c.subTree]) {
            t.rows.on("select item",()=>{l.treeSelect(this,t)});
            t.rows.key("enter",()=>{l.treeEntered(this,t)});
            t.rows.key("right",()=>{l.treeRight(this,t)});
            t.rows.key("left",()=>{l.treeLeft(this,t)});
        }
        c.screen.on("resize",()=>{
            console.clear();
        })
        c.screen.key("tab",()=>{l.screenTab(this)});
        c.screen.key("space",()=>{l.screenTab(this)});
        c.screen.key("escape",()=>{l.screenEsc(this)});
        c.info.key("enter",()=>{l.screenTab(this)});
        c.screen.key(['C-[', 'C-c'],l.screenCtrC);
        c.form.on("focus",()=>{
            c.form.on("keypress",(ch,key)=>{
                const keyn = key.name;
                switch (keyn) {
                    case "backspace":
                        if (this.status.inputValue.length === 0){
                            c.form.setValue("入力 >>  ");
                        }else{
                            this.status.inputValue = this.status.inputValue.slice(0,-1);
                        }
                        break;
                    case "escape":
                        c.form.cancel();
                        c.form.clearValue();
                        this.setFocus(this.components.mainTree)
                        break;
                    case "enter":
                        if (this.status.inputValue.length > 0){
                            c.form.submit();
                            c.form.clearValue();
                            this.setFocus(this.components.mainTree);
                            this.setFocus(this.components.info);
                        }else{
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
                        if (key.sequence){
                            const cond = (
                                   key.sequence.charCodeAt(0) >= 33
                                && key.sequence.charCodeAt(0) <= 126
                                && key.sequence.charCodeAt(0) !== 92
                                && key.sequence.length === 1
                            );
                            if (cond){
                                this.status.inputValue += key.sequence;
                            }
                        }else{
                            this.status.inputValue += key.ch;
                        }
                        break;
                }
            })
            c.form.setValue("入力 >> ");
            this.status.inputValue = "";
            this.components.screen.render();
        })
        c.form.on("blur",()=>{
            c.form.removeAllListeners("keypress")
        })
    }
    #setOriginalEvents(){
        const e = this.event;
        const lb = this.listeners.blessed;
        const lo = this.listeners.original;
        e.on("appinfo",lo.appInfo);      //SUS_LOGIN(使用方法)
        e.on("euc",lo.euc);              //EUC
        e.on("sclass",lo.sclass);        //SCLASS
        e.on("sola",lo.sola);            //SOLA
        e.on("log",lo.logs);             //LOG
        e.on("image",lo.images);         //IMAGE
        e.on("completion",lo.completion);//履修仮組みツール
        e.on("page",lo.pageEnter);       //SOLA_PAGE_LIST
        e.on("return",lo.pageReturn);    //SOLA_PAGE_LISTから戻る
        e.on("pagereload",async()=>{await lo.pageReload(this)}) //SOLA_PAGE_LISTの更新
        e.on("quit",lo.quit);            //QUIT(閉じる)
        e.on("error",(e)=>{
            lo.error(this,e);
        });// イベント内で発生したエラーを拾ってinfo内に表示
        e.on("network",lo.network);      //ネットワーク接続
    }
    #onAllEvents(){
        this.#setListnerList();
        this.#setBlessedEvents();
        this.#setOriginalEvents();
    }
}

export default MainHome;
