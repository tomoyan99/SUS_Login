const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');
const pkg = require('../../package.json');

let mainWindow;
let ptyProcess;
// const inputFilePath = "./sample/sample.js"
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 816,
        height: 640,
        webPreferences:{
            nodeIntegration: true,
            preload:path.join(__dirname,"/preload.cjs"),
            // devTools:false
        },
        useContentSize:true,
        resizable:false,
        title:"SUS_Login"
    });
    mainWindow.loadURL(`file://${__dirname}/../public/render/index.html`);
    mainWindow.on("closed", function() {
        mainWindow = null;
    });
    mainWindow.webContents.on("dom-ready",()=>{
        //イベントの重複登録による
        if (ptyProcess){
            ipcMain.removeAllListeners("terminal.keystroke")
            ipcMain.removeAllListeners("network.changed")
        }
        try {
            // ptyProcess = pty.spawn("node.exe", [inputFilePath], {
                ptyProcess = pty.spawn("bash.exe",[], {
                name: "xterm-color",
                useConpty:true,
                cols: 80,
                rows: 32,
                cwd: process.cwd(),
                env:process.env
            });
            ptyProcess.onData((data) => {
                mainWindow.webContents.send("terminal.incomingData", data);
            });

            ipcMain.on("terminal.keystroke",(event, key) => {
                ptyProcess.write(key);
            })

            ptyProcess.onExit(() => {
                // process.exit(0)
            });
        } catch (error) {
            mainWindow.webContents.send("terminal.incomingData",error+"\n");
        }
    });
}
// ElectronのMenuの設定
const mainMenu = [
    {label: '再起動', role:"reload"},
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