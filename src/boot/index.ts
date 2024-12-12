import {app, BrowserWindow, ipcMain, Menu,MenuItemConstructorOptions} from "electron";
import * as pty from "node-pty";
import path from 'path';
import {npmVersion, confPath, viewConfig} from "./boot_config";
import fs from "fs";

let mainWindow  :BrowserWindow|null = null;
let ptyProcess  :pty.IPty;
let ptyData     :pty.IDisposable;
let ptyExit     :pty.IDisposable;
async function createWindow() {
    mainWindow = new BrowserWindow({
        width: viewConfig.defaultWindowSize.width,
        height: viewConfig.defaultWindowSize.height,
        webPreferences:{
            nodeIntegration: true,
            preload:path.join(__dirname,"./preload.js"),
            // devTools:false,
            disableDialogs:true,
        },
        backgroundColor: '#000',
        minWidth :300,
        minHeight:300,
        useContentSize:true,
        title:`SUS_Login_v${npmVersion}`
    });
    if (mainWindow) {
        mainWindow.once("close",(e)=>{
            //windowのクローズを一旦停止
            e.preventDefault();
            //term.optionsをもらったときの処理
            //userConfig.jsonに今の設定値を記載
            ipcMain.once("terminal.sendOptions",(event, options)=>{
                if (mainWindow){
                    const contentSize = mainWindow.getContentSize();
                    //mainwindowのサイズを取得
                    viewConfig.defaultWindowSize.width  = contentSize[0];
                    viewConfig.defaultWindowSize.height = contentSize[1];

                    //現在のfontSizeをdefaultに
                    viewConfig.defaultFontSize = options.fontSize;

                    //userConfig.jsonを記述
                    fs.writeFileSync(confPath,JSON.stringify(viewConfig),{encoding:"utf8"});
                    //windowを閉じる
                    //eventはonceなので発動しない
                    // mainWindow.close();
                }
            });
            //xtermにリクエストを送るってterm.optionsをもらう
            mainWindow?.webContents.send("terminal.requestOptions");
        });
        mainWindow.on("closed", ()=> {
            mainWindow = null;
        });
        mainWindow.webContents.on("dom-ready",()=>{
            //DOMがリロードされたときにプロセス・イベントが多重起動しないようにする
            if (ptyProcess){
                const PAUSE = "\x13";
                ipcMain.removeAllListeners("terminal.keystroke");
                ipcMain.removeAllListeners("network.changed");
                ptyProcess.write(PAUSE);//フローを一旦止め、安全にプロセスをキル出来るように
                ptyData.dispose();//onDataイベントを削除
                ptyExit.dispose();//onExitイベントを削除
                process.kill(ptyProcess.pid);//プロセスをキル(タイマーなどが初期化される)
            }
            try {
                const inputFilePath = path.join(__dirname,`../../EXE/main.exe`);
                // const cwdPath = path.resolve(__PREFIX,"EXE");
                const cwdPath = "";
                ptyProcess = pty.spawn(inputFilePath, [], {
                // ptyProcess = pty.spawn("bash.exe",[], {
                    name: "xterm-color",
                    cols: viewConfig.defaultTerminalSize.cols,
                    rows: viewConfig.defaultTerminalSize.rows,
                    cwd :cwdPath,
                    env :process.env,
                    handleFlowControl:true,
                    useConpty:true
                });
                //node-ptyからデータが送られてきたらxterm.jsに送信
                ptyData = ptyProcess.onData((data) => {
                    mainWindow?.webContents.send("terminal.incomingData", data);
                });
                //子プロセスが終了したらelectronも閉じる
                ptyExit = ptyProcess.onExit(() => {
                    mainWindow?.close();
                });
                //xtermからキー入力を受け取って、node-ptyに流す
                ipcMain.on("terminal.keystroke",(event, key) => {
                    ptyProcess.write(key);
                })
                //xtermがfitして、resizeしたとき、node-ptyもresize
                ipcMain.on("terminal.resize",(event, resizer) => {
                    ptyProcess.resize(resizer[0], resizer[1]);
                })
            } catch (error) {
                mainWindow?.webContents.send("terminal.incomingData",error+"\n");
            }
        });
        // イベントを設定した後じゃないとだめ
        await mainWindow.loadURL(`file://${__dirname}/render/index.html`);
        mainWindow.focus();
    }
}
// ElectronのMenuの設定
const mainMenu:(MenuItemConstructorOptions)[] = [
    {label: '再起動',role:"reload"},
    {label: 'DevTool', role:"toggleDevTools"},
    {label: "フォント",submenu: [
        {label:"文字大きく",click:()=>{
            mainWindow?.webContents.send("terminal.fontsize",1);
        },accelerator: 'CmdOrCtrl+='},
        {label:"初期値",click:()=>{
            mainWindow?.webContents.send("terminal.fontsize","default");
        }},
        {label:"文字小さく",click:()=>{
            mainWindow?.webContents.send("terminal.fontsize",-1);
        },accelerator: 'CmdOrCtrl+-'}
    ]},
];

const menu = Menu.buildFromTemplate(mainMenu);
Menu.setApplicationMenu(menu);
app.on("ready", createWindow);

app.on("window-all-closed", ()=> {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", ()=> {
    if (mainWindow === null) {
        createWindow();
    }
});
