const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');
const pkg = require('../../package.json');

let mainWindow;
let ptyProcess;

process.env.browserPath = "node_modules/electron/dist/electron.exe";
process.env.infoPath = "data/info.json"

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 821,
        height: 638,
        webPreferences:{
            nodeIntegration: true,
            preload:path.join(__dirname,"/preload.cjs"),
            devTools:false
        },
        useContentSize:true,
        resizable:false,
        title:"SUS_Login"
    });
    mainWindow.loadURL(`file://${__dirname}/../public/render/index.html`);
    mainWindow.on("closed", function() {
        mainWindow = null;
    });
    // mainWindow.on("resize",(event)=>{
    //     console.log(mainWindow.getContentBounds())
    // })
    mainWindow.webContents.on("dom-ready",()=>{
        //イベントの重複登録による
        if (ptyProcess){
            ipcMain.removeAllListeners("terminal.keystroke")
            ipcMain.removeAllListeners("network.changed")
        }
        try {
            const inputFilePath = path.join(__dirname,"../main/main.js")
            ptyProcess = pty.spawn("node.exe", [inputFilePath], {
                // ptyProcess = pty.spawn("bash.exe",[], {
                name: "xterm-color",
                useConpty:true,
                cols: 82,
                rows: 33,
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