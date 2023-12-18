const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');
const {__PREFIX, npmVersion,confPath,userConfig} = require("./public/globalValues.cjs");
const fs = require("fs");

let mainWindow;
let ptyProcess;
let ptyData;
let ptyExit;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: userConfig.defaultWindowSize.width,
        height: userConfig.defaultWindowSize.height,
        webPreferences:{
            nodeIntegration: true,
            preload:path.join(__dirname,"./preload.cjs"),
            devTools:false,
            disableDialogs:true
        },
        backgroundColor: '#000',
        minWidth :300,
        minHeight:300,
        useContentSize:true,
        // resizable:false,
        title:`SUS_Login_v${npmVersion}`
    });
    mainWindow.loadURL(`file://${__dirname}/public/render/index.html`);
    mainWindow.once("close",(e)=>{
        //windowのクローズを一旦停止
        e.preventDefault();
        //term.optionsをもらったときの処理
        //userConfig.jsonに今の設定値を記載
        ipcMain.once("terminal.sendOptions",(event, options)=>{
            const contentSize = mainWindow.getContentSize();
            //mainwindowのサイズを取得
            userConfig.defaultWindowSize.width  = contentSize[0];
            userConfig.defaultWindowSize.height = contentSize[1];

            //現在のfontSizeをdefaultに
            userConfig.defaultFontSize = options.fontSize;

            //userConfig.jsonを記述
            fs.writeFileSync(confPath,JSON.stringify(userConfig),{encoding:"utf8"});
            //windowを閉じる
            //eventはonceなので発動しない
            mainWindow.close();
        });
        //xtermにリクエストを送るってterm.optionsをもらう
        mainWindow.webContents.send("terminal.requestOptions");
    })
    mainWindow.on("closed", ()=> {
        mainWindow = null;
    });
    mainWindow.focus();
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
            const inputFilePath = path.resolve(__PREFIX,`EXE/main.exe`);
            ptyProcess = pty.spawn(inputFilePath, [], {
            // ptyProcess = pty.spawn("node.exe", [inputFilePath], {
            // ptyProcess = pty.spawn("bash.exe",[], {
                name: "xterm-color",
                cols: userConfig.defaultTerminalSize.col,
                rows: userConfig.defaultTerminalSize.row,
                cwd:path.resolve(__PREFIX,"EXE") ,
                env:process.env,
                handleFlowControl:true
            });
            //node-ptyからデータが送られてきたらxterm.jsに送信
            ptyData = ptyProcess.onData((data) => {
                if (mainWindow){
                    mainWindow.webContents.send("terminal.incomingData", data);
                }
            });
            //子プロセスが終了したらelectronも閉じる
            ptyExit = ptyProcess.onExit(() => {
                mainWindow.close();
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
            mainWindow.webContents.send("terminal.incomingData",error+"\n");
        }
    });
}
// ElectronのMenuの設定
const mainMenu = [
    {label: '再起動',role:"reload"},
    // {label: 'DevTool', role:"toggleDevTools"},
    {label: "フォント",submenu: [
        {label:"文字大きく",click:()=>{
            mainWindow.webContents.send("terminal.fontsize",1);
        },accelerator: 'CmdOrCtrl+='},
        {label:"初期値",click:()=>{
            mainWindow.webContents.send("terminal.fontsize","default");
        }},
        {label:"文字小さく",click:()=>{
            mainWindow.webContents.send("terminal.fontsize",-1);
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
