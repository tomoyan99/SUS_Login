const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');
const {termRC,__PREFIX, npmVersion} = require("./public/globalValues.cjs");

let mainWindow;
let ptyProcess;
let ptyData;
let ptyExit;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 820,
        height: 639,
        webPreferences:{
            nodeIntegration: true,
            preload:path.join(__dirname,"./preload.cjs"),
            // devTools:false
            webviewTag:true,
            webgl:true,
            webSecurity:true,
            disableDialogs:true
        },
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
            ptyProcess.kill();//プロセスをキル(タイマーなどが初期化される)
        }
        try {
            const inputFilePath = path.resolve(__PREFIX,"src/terminal_processes/main/main.js")
            // const inputFilePath = path.resolve("resources/src/terminal_processes/main/main.js")
            ptyProcess = pty.spawn("node.exe", [inputFilePath], {
            // ptyProcess = pty.spawn("bash.exe",[], {
                name: "xterm-color",
                useConpty:true,
                cols: termRC.col,
                rows: termRC.row,
                cwd:path.resolve(__PREFIX) ,
                env:process.env,
            });
            ptyData = ptyProcess.onData((data) => {
                if (mainWindow){
                    mainWindow.webContents.send("terminal.incomingData", data);
                }
            });
            ptyExit = ptyProcess.onExit(() => {
                // process.exit(0)
            });
            ipcMain.on("terminal.keystroke",(event, key) => {
                ptyProcess.write(key);
            })
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
    {label: 'DevTool', role:"toggleDevTools"},
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