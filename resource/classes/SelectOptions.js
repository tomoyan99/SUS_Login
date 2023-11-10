/**
 * 選択メニュー用のクラス
 * */
import {isNetConnected} from "../util/checkInternet.js"

export class SelectOptions {
    //エラー時などに描画を割り込ませるとき画面が再描画ループに陥らないようにするため
    static wasChanged = false;
    constructor() {

        //メインメニューの定義
        this.head = [];
        this.body = [];
        this.foot = [];

        //デフォルトメニューの定義
        this.default = {
            head:[],
            body:[],
            foot:[],
        }
        //エラーメニューの定義
        this.error = {
            head:[],
            body:[],
            foot:[],
        }
        this.errorStatus = ""; //エラー状態
    }
    static async build(args,errargs= undefined) {
        const SO = new SelectOptions();
        //デフォルトのメニューの保存用
        SO.default = {
            head:args.head,
            body:args.body,
            foot:args.foot,
        }
        //エラー用メニューが引数に与えられている場合は適用
        if (errargs !== undefined){
            SO.error = {
                head:errargs.head,
                body:errargs.body,
                foot:errargs.foot,
            };
        }
        //エラーステータスの更新
        await SO.setStatus();

        //ネットワーク接続初期条件によってメニューに設定するものを変える
        await SO.setMenu(SO.errorStatus);
        return SO;
    }
    //ネットワークの接続状況
    static get networkConnected() {
        return isNetConnected()
    }
    //現在のメニューを返す
    get Menu(){
        return {
            head:this.head, //メニューヘッダー
            body:this.body, //メニューボディー
            foot:this.foot, //メニューフッター
        }
    }

    //エラー状態か否かを切り替え
    static async switchStatus(){
        this.wasChanged = !this.wasChanged;
    }

    //エラーステータスの設定
    async setStatus(){
        this.errorStatus = await isNetConnected()?"normal":"error";
        return this;
    }

    //メニューの設定
    async setMenu(mode="normal"){
        if (mode === "normal"){
            this.head = this.default.head;
            this.body = this.default.body;
            this.foot = this.default.foot;
        }else if (mode === "error"){
            this.head = this.error.head;      //メニューヘッダー
            this.body = this.error.body;       //メニューボディー
            this.foot = this.error.foot;      //メニューフッター
        }
        return this;
    }
}