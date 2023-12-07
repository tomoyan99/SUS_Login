const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');

let mainWindow;
let ptyProcess;
let ptyData;
let ptyExit;

process.env.browserPath = "node_modules/electron/dist/electron.exe";
process.env.infoPath = "data/info.json"
process.env.npm_version = require("../../package.json").version

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 821,
        height: 638,
        webPreferences:{
            nodeIntegration: true,
            preload:path.join(__dirname,"./preload.cjs"),
            devTools:false
        },
        useContentSize:true,
        resizable:false,
        title:`SUS_Login_v${process.env.npm_version}`
    });
    mainWindow.loadURL(`file://${__dirname}/public/render/index.html`);
    mainWindow.on("closed", function() {
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
            ptyProcess.kill();//プロセスをキル(タイマーなどが初期化される)
        }
        try {
            const inputFilePath = path.join(__dirname,"../terminal_processes/main/main.js")
            // const inputFilePath = path.resolve("resources/src/terminal_processes/main/main.js")
            ptyProcess = pty.spawn("node.exe", [inputFilePath], {
                // ptyProcess = pty.spawn("bash.exe",[], {
                name: "xterm-color",
                useConpty:true,
                cols: 82,
                rows: 33,
                // cwd: path.resolve("resources"),
                cwd: process.cwd(),
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
        } catch (error) {
            mainWindow.webContents.send("terminal.incomingData",error+"\n");
        }
    });
}
// ElectronのMenuの設定
const mainMenu = [
    {label: '再起動',role:"reload"}
    // {label: 'DevTool', role:"toggleDevTools"},
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