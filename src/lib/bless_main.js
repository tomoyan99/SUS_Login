const Blessed = require('neo-blessed');
const contrib = require('neo-blessed-contrib');
const EventEmitter = require('events');
const {decycle} = require("json-cyclic");


class FormatData{
    data = {
        main:{},
        sub :{}
    }
    /**
     * @param {Object} args
     * @param {Object} args.main
     * @param {Object} args.sub
     * */
    constructor(args) {
        this.data.main = this.#parseListData(args[0]);
        this.data.sub  = this.#parseListData(args[1]);
    }
    /**
     * @name parseListData
     * @param {Object} data 入力データ
     * @param {Number} depth 階層
     * @description データをcontrib-tree用に整形する関数
     * */
    #parseListData(data, depth = 0) {
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
                edited_data.children[dataKey] = this.#parseListData(data[dataKey], depth + 1);
            }
        }
        return edited_data;
    }
}
class Members extends FormatData{
    status={
        network:undefined,
        inputValue:"",
        focus:{
            bef:undefined,
            now:undefined
        },
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
            fg:"#ff0000",
            bg:"#ffa600"
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
            title: 'Bless_main', // TUIのタイトル
            terminal:"xterm-256color",
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
        this.components.net = this.components.grid.set(...this.position.net, Blessed.text, {
            keys: false, // キー入力
            parent: this.components.screen, // 必ず指定
            name: "net",
            label: 'NETWORK_STATUS', // 表示する名称
            align: 'left',
            content: `接続ステータス：${this.status.network}`,
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
            this.components.choice.setContent(contents);
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
            info.render();
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
            keys:["right","left"],
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
        main.setData(this.data.main);
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
            keys: ["right", "left"],
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
class MainBlessed extends SetComponents{
    event = new EventEmitter();
    listeners = {
        origin: {},
        blessed:{}
    };
    constructor(args) {
        //this.dataの作成
        super(args);
        this.#onAllEvents();
        //最初はコマンド選択部をフォーカス
        this.setFocus(this.components.mainTree);
        //mainTree一番上の要素を選択
        this.components.mainTree.rows.emit("select item");
        //画面のレンダリング
        this.components.screen.render();
    }
    #setListnerList(){
        const l = this.listeners;
        l.blessed = {
            treeEntered: (t)=> {
                const c = this.components;
                const root = t.rows;
                const node = t.nodeLines[root.getItemIndex(root.selected)];
                //選択した要素からエスケープを取り除き、選択時の色を付けて表示
                const reg = /{.+?}(.+?){\/}/g;
                let content = node.name.replace(reg,"$1");
                let colored_content = `選択 >> {${this.colors.choice.fg}-fg}{${this.colors.choice.bg}-bg}${content}{/}{/}`;
                this.setChoice(colored_content);
                //イベントをエミット
                try {
                    this.event.emit(node.event);
                }catch (e){
                    this.event.emit("error",e);
                }finally {
                    c.screen.render();
                }
            },
            treeSelect:(t)=>{
                const root = t.rows;
                const node = t.nodeLines[root.getItemIndex(root.selected)];
                if (node){
                    let content = `選択 >> {blink}${node.name}{/}`
                    //選択したものを点滅させながら選択表示部に表示
                    this.setChoice(content);
                }
            },
            treeRight:(t)=>{
                const root = t.rows;
                const node = t.nodeLines[root.getItemIndex(root.selected)];
                //この処理なに？？？？？(消すとリスト開閉がバグる)
                if (node.children) {
                    node.extended = true;
                    t.setData(t.data);
                    t.render();
                }
            },
            treeLeft:(t)=>{
                const root = t.rows;
                const node = t.nodeLines[root.getItemIndex(root.selected)];
                //この処理なに？？？？？(消すとリスト開閉がバグる)
                if (node.children) {
                    node.extended = false;
                    t.setData(t.data);
                    t.render();
                }
            },
            screenTab:()=>{
                if (this.status.focus.now.name !== "info"){
                    this.setFocus(this.components.info);
                }else{
                    this.setFocus(this.status.focus.bef);
                }
            },
            screenEsc:()=>{
                const f_now_name = this.status.focus.now.name;
                if (f_now_name && f_now_name === "info"){
                    this.setFocus(this.status.focus.bef);
                }
            },
            screenCtrC:()=>{process.exit(0)}
        }
        l.origin = {
            euc:()=>{
                const c = this.components;
                const f = c.form;
                c.form.once("focus",()=>{
                    c.form.once("submit",()=>{
                        const value = this.status.inputs;
                        this.setInfo(value);
                    });
                    c.form.on("keypress",(ch,key)=>{
                        const keyn = key.name;

                        switch (keyn) {
                            case "backspace":
                                if (this.status.inputs.length === 0){
                                    c.form.setValue("入力 >>  ");
                                }else{
                                    this.status.inputs = this.status.inputs.slice(0,-1);
                                }
                                break;
                            case "escape":
                                c.form.cancel();
                                c.form.clearValue();
                                this.setFocus(this.components.mainTree)
                                break;
                            case "enter":
                                c.form.submit();
                                c.form.clearValue();
                                this.setFocus(this.components.mainTree)
                                break;
                            case "return":
                                break;
                            default:
                                //制御文字とバックスラッシュは除外
                                const cond = (
                                    key.full.length === 1
                                    && key.full.charCodeAt(0) >= 33
                                    && key.full.charCodeAt(0) <= 126
                                );
                                if (cond){
                                    this.status.inputs += (key.sequence)?key.sequence:key.ch;
                                }
                                break;
                        }
                    })
                    c.form.setValue("入力 >> ");
                    this.status.inputs = "";
                    this.components.screen.render();
                })
                c.form.once("blur",()=>{
                    c.form.removeAllListeners("keypress")
                })
                this.setFocus(f);
            },
            sclass:()=>{
                this.setInfo("sclass!");
            },
            sola:()=>{
                this.setInfo("sola!")
            },
            pageEnter:()=>{
                const c = this.components;
                this.setFocus(c.subTree);
                c.subTree.setData(this.data.sub);
                c.subTree.rows.select(0);
            },
            pageReturn:()=>{
                const c = this.components;
                this.setFocus(c.mainTree);
                c.subTree.setData({});
            },
            quit:()=>{
                throw new Error("テストエラー")
                // process.exit(0);
            },
            logs:()=>{
                this.setInfo("log!!")
            },
            images:()=>{
                this.setInfo("image!")
            },
            completion:()=>{
                this.setInfo("completion!")
            },
            error:(e)=>{
                this.setInfo(e.stack.toString());
                l.blessed.screenTab();
            },
        }
    }
    #setBlessedEvents(){
        const c = this.components;
        const l = this.listeners.blessed;
        //ツリーのイベントの設定
        for (const t of [c.mainTree,c.subTree]) {
            t.rows.on("select item",()=>{l.treeSelect(t)})
            t.rows.key("right",()=>{l.treeRight(t)})
            t.rows.key("left",()=>{l.treeLeft(t)})
            t.rows.key("enter",()=>{l.treeEntered(t)});
        }
        c.screen.key("tab",l.screenTab)
        c.screen.key("escape", l.screenEsc)
        c.screen.key(['C-[', 'C-c'],l.screenCtrC);

    }
    #setOriginalEvents(){
        const e = this.event;
        const l = this.listeners.origin;
        e.on("euc",l.euc);              //EUC
        e.on("sclass",l.sclass);        //SCLASS
        e.on("sola",l.sola);            //SOLA
        e.on("log",l.logs);             //LOG
        e.on("image",l.images);         //IMAGE
        e.on("completion",l.completion);//履修仮組みツール
        e.on("page",l.pageEnter);       //SOLA_PAGE_LIST
        e.on("return",l.pageReturn);    //SOLA_PAGE_LISTから戻る
        e.on("quit",l.quit);            //QUIT(閉じる)
        e.on("error",l.error);
    }
    #onAllEvents(){
        this.#setListnerList();
        this.#setBlessedEvents();
        this.#setOriginalEvents();
    }
}

const commandList = {
    "SUS_LOGIN":{
        "{#0f0-fg}EUC{/}":{
            event:"euc"
        },
        "SCLASS":{
            event:"sclass"
        },
        "SOLA":{
            event:"sola",
            "{#3aa-fg}PAGE_LIST{/}":{event:"page"}
        },
        "履修仮組みツール":{event:"completion"}
    },
    "LOG":{event:"log"},
    "IMAGE":{event:"image"},
    "{red-fg}QUIT{/}":{event:"quit"},
}
const pageList = {
    "前期":{
        "1":{event:"sola",url:"1"},
        "2":{event:"sola",url:"2"},
        "3":{event:"sola",url:"3"},
        "4":{event:"sola",url:"4"},
        "5":{event:"sola",url:"5"},
        "6":{event:"sola",url:"6"},
    },
    "後期":{
        "7":{event:"sola",url:"7"},
        "8":{event:"sola",url:"8"},
        "9":{event:"sola",url:"9"},
        "a":{event:"sola",url:"a"},
        "b":{event:"sola",url:"b"},
        "c":{event:"sola",url:"c"},
    },
    "{yellow-fg}戻る{/}":{event:"return"}
}

const MB1 = new MainBlessed([commandList,pageList]);