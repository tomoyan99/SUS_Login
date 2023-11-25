"use strict";
/*
	[SUS_login]
	諏訪理科のsola,sclassに自動ログインしたり、eucを自動で入力してくれるスクリプト。
*/

/*
	使用モジュール
		puppeteer:自動入力やクリックを担う
		fs       :jsonファイルの取り込み
		input    :標準入力全般。パスワードの入力にも用いる
		choice   :選択肢の表示とキー選択
		today    :日付関連モジュール
		control  :コンソールの色等の制御
		pause    :ポーズコマンドの再現
    child_process:windowsコマンドの実行
    checkInternet:ネットワーク接続の確認
        timers   :インターバルの削除
    SelectOptions:選択肢選択用のクラス
    importJSON   :JSONをimportしやすいモジュール

*/
import {launch} from 'puppeteer'; //pupeteerのインポート
import {appendFileSync, existsSync, writeFileSync} from 'fs'; //fsのインポート
import {input} from '../lib/utils/input.js'; //標準入力・パス入力
import {choice} from "../lib/utils/choise.js"; //十字キー選択
import {today} from '../lib/utils/today.js'; //日付関連
import {control as cl} from "../lib/utils/control.js"; //コンソール制御関連
import {pause} from '../lib/utils/pause.js'; //PAUSEコマンドの再現
import {execSync} from "child_process"; //コンソールコマンドの実行
import {isNetConnected} from "../lib/utils/checkInternet.js"
import {clearInterval} from "timers";
import {SelectOptions} from "./classes/SelectOptions.js"
import {importJSON} from "../lib/utils/importJSON.js"
import {makeSchedule} from "../lib/utils/makeSchedule.js";
import {crypt} from "../lib/crypt.js";
import {hostname} from "os";

/* sleep関数 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

/* writeJSON関数 */
function writeJSON(dir, data) {
    if (typeof data === "string"){
        writeFileSync(dir, data);
    }else{
        writeFileSync(dir, JSON.stringify(data));
    }
}

/*
	login関数
	ここでは開きたいサイトのコマンドを標準入力で受け取ったり、
	openSUS関数の実行をしたりしてます。
*/
export async function login(version = "",data,sola_link) {
    /*
        十字キー選択によって、[sclass],[sola],[sclass,sola],[euc]の判定を行い、
        eucならさらに番号の入力を求める。
        [list]を選択すると履修中の科目リストが表示され、選択すると対応したsolaのページurlを設定
        エラーがなければopenSUSを実行する。
    */
    let EUC = 0;//EUC番号を格納する変数

    data.miss_count = 0; //	EUC登録ミスの回数カウント
    data.access_dot = {
        waitmsec:1000,
        max_quant:3
    }//アクセス待機用のドット表示パラメータ

    //sola_link.jsonの中身
    let page_name = {"bf": [], "af": []};//sola_linkから科目名のみ取り出し
    let page_url = {"bf": [], "af": []};//sola_linkからurlのみ取り出し
    let page_link = {};

    /* コピー実行部 */
    page_name.bf = sola_link.bf.map((d) => d.name);
    page_name.af = sola_link.af.map((d) => d.name);
    page_url.bf = sola_link.bf.map((d) => d.url);
    page_url.af = sola_link.af.map((d) => d.url);
    /* 科目名をキー、 値をurlとしたテーブルの作成*/
    //前期
    for (let i = 0; i < sola_link.bf.length; i++) {
        page_link[page_name.bf[i]] = page_url.bf[i];
    }
    //後期
    for (let i = 0; i < sola_link.af.length; i++) {
        page_link[page_name.af[i]] = page_url.af[i];
    }
    const default_solaURL = data.sola.url;
    //一定時間操作がなければプロセスを終了
    const timeout = new function timeOut(){
        //開始時間
        this.start=new Date().valueOf();
        //タイムリミット
        this.limit_msec = ()=>{
            const time = {
                days    :1,  //日
                hours   :0,  //時
                minutes :0,  //分
                seconds :0,  //秒
            }
            function getMilliSec(t){
                const D_msec = t.days*24*60*60*1000;
                const H_msec = t.hours*60*60*1000;
                const M_msec = t.minutes*60*1000;
                const S_msec = t.seconds*1000;
                return D_msec+H_msec+M_msec+S_msec;
            }
            return getMilliSec(time);//制限時間 時 分 秒 ミリ秒(デフォルトで40分)
        };
        this.end =this.start +  this.limit_msec();
    };

    setInterval(()=>{
        if (new Date().valueOf() > timeout.end){
            console.log(`${cl.fg_yellow}一時間操作がなかったためタイムアウトしました。${cl.fg_reset}`);//表示されない。
            process.exit(0);
        }
    },1000);

    //ネットワーク接続判定
    let network_ID = null;

    //メニューループ
    selectcommand:
        do {
            let state = undefined;
            //network_IDが更新されていたときnetwork_IDのインターバルを削除
            if (network_ID !== null){
                clearInterval(network_ID);
            }
            data.sola.url = default_solaURL;
            //選択用のargs
            const homemenu = {
                head: [
                    [`SUS_login_v${version}`],
                    [`${cl.fg_green}十字キーで開きたい項目を選択してね${cl.fg_reset}`,`インターネット接続状況：${cl.bg_green}良好${cl.bg_reset}`],
                    [""]
                ],
                body: [
                    ["1.euc", ">>logs", ">>images"],
                    ["2.sola", ">>List","@ SOLAリスト更新"],
                    ["3.sclass"],
                    ["4.sclassとsola"],
                    ["5.履修仮組みツール"],
                    [`${cl.fg_red}6.QUIT${cl.fg_reset}`]
                ],
                foot: [
                    [""],
                    ["選択?>"],
                ]
            };
            const errhomemenu =  {
                head: [
                    [`SUS_login_v${version}`],
                    [`${cl.fg_green}十字キーで開きたい項目を選択してね${cl.fg_reset}`, `インターネット接続状況：${cl.bg_red}不良${cl.bg_reset}`],
                    [`${cl.fg_yellow}※ ネットワークが繋がっていないため${cl.fg_red}QUIT${cl.fg_reset}以外の操作を拒絶中です！${cl.fg_reset}`],
                    [""]
                ],
                body: [
                    ["1.euc", ">>logs", ">>images"],
                    ["2.sola", ">>List","@ SOLAリスト更新"],
                    ["3.sclass"],
                    ["4.sclassとsola"],
                    ["5.履修仮組みツール"],
                    [`${cl.fg_red}6.QUIT${cl.fg_reset}`]
                ],
                foot: [
                    [""],
                    ["選択?>"],
                ]
            };
            const termmenu = {
                bf : {
                    head: [
                        [`前期solaリンク選択はぁと${cl.fg_red} ❤ ${cl.fg_reset}`],
                        [""],
                    ],
                    body: page_name.bf.map((d) => [d]),
                    foot: [
                        [""],
                        ["選択?>"]
                    ],
                },
                af : {
                    head: [
                        [`後期solaリンク選択はぁと${cl.fg_red} ❤ ${cl.fg_reset}`],
                        [""],
                    ],
                    body: page_name.af.map((d) => [d]),
                    foot: [
                        [""],
                        ["選択?>"]
                    ],
                }
            }

            const main_option = {
                home : await SelectOptions.build(homemenu,errhomemenu),
                bf   : await SelectOptions.build(termmenu.bf,errhomemenu),
                af   : await SelectOptions.build(termmenu.af,errhomemenu)
            }
            let oldNetwork = await isNetConnected();
            /*
            * ここではネットワーク接続状況を検知して、main_optionの表示画面をエラーと通常時で切り替えている
            * 切り替えた結果はchoise.jsで適用される
            * */
            network_ID = setInterval(async()=>{
                const nowNetwork = await isNetConnected() // //0.1秒に一回接続状況に変化があるか確認。なければ何もしない
                if (nowNetwork !== oldNetwork){
                    for (const mainOptionKey in main_option) {
                        //ステータスをnormal or errorに切り替えた後メニューをセット
                        await (await main_option[mainOptionKey].setStatus()).setMenu(main_option[mainOptionKey].errorStatus);
                    }
                    oldNetwork = nowNetwork;
                }
            },50);


            /*
            * ホーム画面
            */
            //選択
            state = await choice(main_option.home);

            //制限時間の更新
            timeout.now = new Date().valueOf();
            //コマンドリスト
            let comlist = [
                [["euc"], ["logs"], ["images"]],
                [["sola"], ["solalist"],["list_reload"]],
                [["sclass"]],
                [["sclass", "sola"]],
                [["course_registration"]],
                [["quit"]]
            ];
            //コマンドリストの中からどれを選んだか
            let whichOpen = comlist[state.index[0]][state.index[1]];
            //QUITを選択した場合は終了
            if (whichOpen[0] === "quit") {
                break selectcommand;
            }
            //ネットワークが繋がっていない場合はQUIT以外何もできないようにする
            if (!await isNetConnected()){
                continue selectcommand;
            }
            switch (whichOpen[0]) {
                //EUC入力
                case "euc":
                    console.log(`EUCを入力してください\n${cl.fg_yellow}※キャンセルする場合は何も入力せずエンターをおしてね${cl.fg_reset}`);
                    EUC = await input("euc?>");
                    data.miss_count = 0;
                    if (EUC === "") {
                        break;//何も入力されなかったらコマンド入力に戻る
                    }
                    await openSUS(whichOpen, EUC, data).catch((reason)=>{
                        console.log(reason);
                    });//openSUSを実行
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;//何も入力されなかったらコマンド入力に戻る

                //eucのlogファイルを開く
                case "logs":
                    console.log("EUCログを開きます");
                    execSync("start logs/euc.log");
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;

                //imagesフォルダを開く
                case "images":
                    console.log("EUCスクリーンショットを開きます");
                    execSync("start images");
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;

                case "sclass":
                    await openSUS(whichOpen, EUC, data);//openSUSを実行
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;

                case "sola":
                    await openSUS(whichOpen, EUC, data);//openSUSを実行
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;

                //solalistページに遷移
                case "solalist":
                    //前後期選択肢の末尾に前期後期切り替えページ用の選択肢を挿入
                    main_option.bf.body.push([`${cl.fg_yellow}<<戻る${cl.fg_reset}`, `${cl.fg_green}>>後期ページへ${cl.fg_reset}`]);
                    main_option.af.body.push([`${cl.fg_yellow}<<戻る${cl.fg_reset}`, `${cl.fg_green}>>前期ページへ${cl.fg_reset}`]);
                    let term = today.whichTerm();
                    //ページループ
                    selectpage:
                        while (true) {
                            //今の学期を先に開く
                            state = await choice(main_option[term]);
                            //入力がQUITならメニューループを抜ける
                            if (state.str === "5.QUIT"){
                                break selectcommand;
                            }
                            //ネットワークが繋がっていなければループ
                            if (!await isNetConnected()){
                                continue selectpage;
                            }
                            //ページの選択をしたときはループ
                            switch (state.str) {
                                case ">>後期ページへ":
                                    term = "af";
                                    continue selectpage;
                                case ">>前期ページへ":
                                    term = "bf";
                                    continue selectpage;
                                case "<<戻る":
                                    continue selectcommand;
                                default:
                                    //ページの選択以外の科目ページを選択したら、起動コマンドをsolaにし、solaのurlを対応する科目ページのurlにする"
                                    whichOpen = ["sola"];
                                    data.sola.url = page_link[state.str];
                                    await openSUS(whichOpen, EUC, data);
                                    await pause("pass","[エンターを押してリストに戻る]");
                                    continue selectpage;
                            }
                        }
                case "list_reload":
                    console.clear();
                    console.log("履修科目データの更新を行います");
                    await sleep(1500);
                    console.log(`${cl.fg_yellow}※ 科目データの更新には、回線の都合上3分ほどかかる場合がありますので、このままお待ち下さい${cl.fg_reset}`);
                    try {
                        const sola_link = await makeSchedule(data);
                        writeJSON("src/data/info.json", await crypt.encrypt(data));//info.jsonを暗号化して書き込み
                        writeJSON("src/data/sola_link.json", await crypt.encrypt(sola_link));//info.jsonを暗号化して書き込み
                    }catch (e){
                        throw new Error(`${cl.fg_red}\n科目データの更新に失敗しました。${cl.fg_reset}\nネットワークの接続状況を確認して、再実行してください。それでも失敗するようでしたら、${cl.fg_cyan}infoClear.exe${cl.fg_reset}を実行して初期化ののちもう一度最初から登録を行ってください。\n`);
                    }
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;
                case "course_registration":
                    console.log(`${cl.bg_yellow}[只今工事中・・・ごめんぴ☆ミ]${cl.bg_reset}`)
                    await pause("pass","[エンターを押して選択に戻る]");
                    break;
                default :
                    await pause("pass","[エンターを押して選択に戻る]");
            }
        } while (true); //selectcommand
    return 0;
}

/*
	openSUS関数
	main関数で入力されたコマンドに対応するサイトを開き、自動操縦を行う。
	EUCが選択されたときはヘッドレス。
*/
async function openSUS(whichOpen, EUC, data) {

    //コマンドがeuc,sola,sclassでなければ抜ける
    if (whichOpen[0] !=="euc" && whichOpen[0] !== "sclass" && whichOpen[0] !== "sola" ){
        return 0;
    }
    /* ブラウザの立ち上げ */
    const browser = await launch({
        headless: (whichOpen[0] === "euc") ? "new" : false, //ヘッドレス(ブラウザの表示・非表示)の設定。falseなら表示
        slowMo: (whichOpen[0] === "euc") ? 0 : 0, //タイピング・クリックなどの各動作間の速度
        defaultViewport: null, //ブラウザサイズとviewportがずれる不具合の防止
        channel: "chrome",//chromeを探し出して開く
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: [
            "--disable-extensions",
            "--enable-automation",
        ],
        args: [
            "--proxy-server='direct://'",
            "--proxy-bypass-list=*"
        ]
    }).catch(() => {
        throw new Error(cl.fg_red + "ブラウザが開きませんでした。chromeがインストールされていることを確認してください。" + cl.bg_reset);
    });

    const context = await browser.createIncognitoBrowserContext();//シークレットモードで開くため
    const pagesB = await browser.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
    if (whichOpen[0] !== "euc") {
        await pagesB[0].close();//about:brankを削除
    }
    //[sclass,sola]だった場合どっちも起動
    for (const site of whichOpen) {
        data.miss_count = 0; //ミスカウントの初期化
        data.clg_count = 0;
        /* sclassのとき */
        if (site === "sclass") {
            await context.newPage();
            let pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
            Errorloop:
                while (true) {
                    try {
                        await openSclass(context, data);
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        await pagesC[Math.max(pagesC.length - 2, 0)].close();
                        break;
                    } catch (error) {
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        if (pagesC.length - 1 > 0){
                            await pagesC[pagesC.length - 1].close();
                            for (let i = 0; i < data.clg_count; i++) {
                                process.stdout.write(`${cl.up}${cl.lineClear}`);
                            }
                            console.log(`${cl.bg_yellow}${cl.fg_black}接続エラー(${data.miss_count + 1})：接続に失敗しました再試行します。${cl.fg_reset}`);
                            if (data.miss_count === 3) {
                                console.log(`\n${cl.bg_red}アクセスエラー：sclassへのアクセスに失敗しました。ネットワークが混雑している可能性があるので、しばらく時間をおいて再度試してください。${cl.bg_reset}\n`);
                                pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                                await pagesC[Math.max(pagesC.length - 2, 0)].close();
                                break;
                            }
                            data.miss_count++;
                            await sleep(1000);
                        }else{
                            break;
                        }
                    }
                }
        }//if sclass
        /* solaのとき */
        if (site === "sola") {
            await context.newPage();
            let pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
            Errorloop:
                while (true) {
                    try {
                        await openSola(context, data);
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        await pagesC[Math.max(pagesC.length - 2, 0)].close();
                        break;
                    } catch (error) {
                        pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                        if (pagesC.length - 1 > 0){
                            await pagesC[pagesC.length - 1].close();
                            for (let i = 0; i < data.clg_count; i++) {
                                process.stdout.write(`${cl.up}${cl.lineClear}`);
                            }
                            console.log(`${cl.bg_yellow}${cl.fg_black}接続エラー(${data.miss_count + 1})：接続に失敗しました再試行します。${cl.fg_reset}`);
                            if (data.miss_count === 3) {
                                console.log(`\n${cl.bg_red}アクセスエラー：solaへのアクセスに失敗しました。ネットワークが混雑している可能性があるので、しばらく時間をおいて再度試してください。${cl.bg_reset}`);
                                pagesC = await context.pages();//ブラウザのページリストを取得。(0がabout:brankでこれを消すため)
                                await pagesC[Math.max(pagesC.length - 2, 0)].close();
                                break;
                            }
                            data.miss_count++;
                            await sleep(1000);
                        }else{
                            break;
                        }
                    }
                }

        }// if sola
        /* eucのとき */
        if (site === "euc") {
            Errorloop:
                while (true) {
                    try {
                        await openEuc(context, data, EUC);
                        break;
                    } catch (error) {
                        // console.log(error);
                        for (let i = 0; i < data.clg_count; i++) {
                            process.stdout.write(`${cl.up}${cl.lineClear}`);
                        }
                        console.log(`${cl.bg_yellow}${cl.fg_black}接続エラー(${data.miss_count + 1})：接続に失敗しました再試行します。${cl.fg_reset}`);
                        if (data.miss_count === 3) {
                            await browser.close();
                            console.log(`\n${cl.bg_red}登録エラー：EUCの登録に失敗しました。ネットワークが混雑している可能性があるので、しばらく時間をおいて再度試してください。${cl.bg_reset}`);
                            break;
                        }
                        data.miss_count++;
                        await sleep(300);
                    }
                }
            await browser.close();
        }//if EUC
    }// for of
}







