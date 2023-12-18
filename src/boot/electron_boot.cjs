const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');
const {termRC,__PREFIX, npmVersion} = require("./public/globalValues.cjs");

let mainWindow;
let ptyProcess;
let ptyData;
let ptyExit;
const defaultWindowSize = {
    width:820,
    height:640
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: defaultWindowSize.width,
        height: defaultWindowSize.height,
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
    mainWindow.on("closed", function() {
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
            const inputFilePath = path.resolve(__PREFIX,`EXE/SUS_Login_v${npmVersion}.exe`);
            ptyProcess = pty.spawn(inputFilePath, [], {
            // ptyProcess = pty.spawn("node.exe", [inputFilePath], {
            // ptyProcess = pty.spawn("bash.exe",[], {
                name: "xterm-color",
                cols: termRC.col,
                rows: termRC.row,
                cwd:path.resolve(__PREFIX,"EXE") ,
                env:process.env,
            });
            //node-ptyからデータが送られてきたらxterm.jsに送信
            ptyData = ptyProcess.onData((data) => {
                if (mainWindow){
                    mainWindow.webContents.send("terminal.incomingData", data);
                }
            });
            //子プロセスが終了したらelectronも閉じる
            ptyExit = ptyProcess.onExit(() => {
                process.exit(0)
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
    {label: "ウィンドウサイズ初期化",click:()=>{
        if (mainWindow){mainWindow.setContentSize(defaultWindowSize.width,defaultWindowSize.height,true);}}
    }
];

const menu = Menu.buildFromTemplate(mainMenu);
Menu.setApplicationMenu(menu);
app.on("ready", createWindow);
app.on("window-all-closed", function() {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    if (mainWindow === null) {
        createWindow();
    }
});