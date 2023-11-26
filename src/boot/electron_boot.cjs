const {app, BrowserWindow, ipcMain,Menu} = require("electron");
const pty = require("node-pty");
const path = require('path');
const pkg = require('../../package.json');
const pie = require("puppeteer-in-electron");
const puppeteer = require("puppeteer");

let mainWindow;
let ptyProcess;

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
    // mainWindow.loadURL("https://www.google.co.jp/");
    mainWindow.on("closed", function() {
        app.quit();
    });


    mainWindow.webContents.on("dom-ready",()=>{
        //イベントの重複登録による
        if (ptyProcess){
            ipcMain.removeAllListeners("terminal.keystroke")
            ipcMain.removeAllListeners("network.changed")
        }
        try {
            const inputFilePath = "src/test/test1.cjs"
            // const inputFilePath = "src/main/main.js"
            // ptyProcess = pty.spawn("electron", [inputFilePath], {
            ptyProcess = pty.spawn("node.exe", [inputFilePath], {
            //     ptyProcess = pty.spawn("bash.exe",[], {
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