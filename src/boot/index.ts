import {app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions} from "electron";
import * as pty from "node-pty";
import path from "path";
import {npmVersion, viewConfig} from "./boot_config";
import fs from "fs";
import {ITerminalOptions} from "xterm";

let mainWindow: BrowserWindow | null = null;
let ptyProcess: pty.IPty|undefined;
let ptyData: pty.IDisposable|undefined;
let ptyExit: pty.IDisposable|undefined;

// let port:Promise<number> = getDebuggerPort(app);
// ウィンドウの初期化
async function createWindow() {
    mainWindow = new BrowserWindow({
        width: viewConfig.defaultWindowSize.width,
        height: viewConfig.defaultWindowSize.height,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "./preload.js"),
            disableDialogs: true,
        },
        backgroundColor: '#000',
        minWidth: 300,
        minHeight: 300,
        useContentSize: true,
        title: `SUS_Login_v${npmVersion}`,
    });

    if (mainWindow) {
        // const url = await getDebuggerUrl(await port);
        // process.env.DEBUG_URL = url??"";
        setupWindowEvents();
        await loadWindowContent();
    }
}

// ウィンドウ関連のイベント設定
function setupWindowEvents() {
    if (!mainWindow) return;

    mainWindow.once("close", (e) => {
        e.preventDefault();
        handleWindowClose();
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.webContents.on("dom-ready", initializeTerminalProcess);
}

// ウィンドウのクローズ処理
function handleWindowClose() {
    ipcMain.once("terminal.sendOptions", (event, options) => {
        // ウィンドウの設定を保存
        if (mainWindow) {
            saveWindowConfig(options);
            mainWindow.close();
        }
    });
    mainWindow?.webContents.send("terminal.requestOptions");
}

// ウィンドウの設定を保存
function saveWindowConfig(options:ITerminalOptions) {
    const contentSize = mainWindow?.getContentSize();
    viewConfig.defaultWindowSize.width = contentSize ? contentSize[0] : viewConfig.defaultWindowSize.width;
    viewConfig.defaultWindowSize.height = contentSize ? contentSize[1] : viewConfig.defaultWindowSize.height;
    viewConfig.defaultFontSize = options.fontSize??17;
    fs.writeFileSync(<string>process.env.confPath, JSON.stringify(viewConfig,null,2), { encoding: "utf8" });
}

// ターミナルプロセスの初期化
function initializeTerminalProcess() {
    if (ptyProcess && ptyData && ptyExit) {
        cleanupPreviousPtyProcess(ptyProcess,ptyData,ptyExit);
    }
    try {
        const cwdPath = "";
        ptyProcess = pty.spawn(<string>process.env.inputFilePath, [], {
            name: "xterm-color",
            cols: viewConfig.defaultTerminalSize.cols,
            rows: viewConfig.defaultTerminalSize.rows,
            cwd : cwdPath,
            env : process.env,
            handleFlowControl: true,
            useConpty: true,
        });
        ptyData = ptyProcess.onData((data) => {
            mainWindow?.webContents.send("terminal.incomingData", data);
        });
        ptyExit = ptyProcess.onExit(() => {
            mainWindow?.close();
        });
        setupPtyIpcListeners(ptyProcess);
    } catch (error) {
        mainWindow?.webContents.send("terminal.incomingData", error + "\n");
    }
}

// 以前のPTYプロセスのクリーンアップ
function cleanupPreviousPtyProcess(ptyProcess:pty.IPty,ptyData:pty.IDisposable,ptyExit:pty.IDisposable) {
    const PAUSE = "\x13";
    ipcMain.removeAllListeners("terminal.keystroke");
    ipcMain.removeAllListeners("network.changed");
    ipcMain.removeAllListeners("terminal.resize");
    ptyProcess.write(PAUSE);
    ptyData.dispose();
    ptyExit.dispose();
    process.kill(ptyProcess.pid);
}

// IPCイベントリスナーの設定
function setupPtyIpcListeners(ptyProcess:pty.IPty) {
    ipcMain.on("terminal.keystroke", (event, key:string) => {
        ptyProcess.write(key);
    });
    ipcMain.on("terminal.resize", (event, resizer:number[]) => {
        ptyProcess.resize(resizer[0], resizer[1]);
    });
}

// メニューの設定
function setupMenu() {
    const mainMenu: MenuItemConstructorOptions[] = [
        { label: '再起動', role: "reload" },
        // { label: 'DevTool', role: "toggleDevTools" },
        { label: "フォント", submenu: [
            { label: "文字大きく", click: () => { changeFontSize(1); }, accelerator: 'CmdOrCtrl+=' },
            { label: "初期値", click: () => { resetFontSize(); } },
            { label: "文字小さく", click: () => { changeFontSize(-1); }, accelerator: 'CmdOrCtrl+-' }
            ]
        },
    ];

    const menu = Menu.buildFromTemplate(mainMenu);
    Menu.setApplicationMenu(menu);
}

// フォントサイズを変更
function changeFontSize(sizeChange: number | "default") {
    mainWindow?.webContents.send("terminal.fontsize", sizeChange);
}

// フォントサイズを初期化
function resetFontSize() {
    mainWindow?.webContents.send("terminal.fontsize", "default");
}

// ウィンドウの内容を読み込む
async function loadWindowContent() {
    await mainWindow?.loadURL(`file://${__dirname}/render/index.html`);
    mainWindow?.focus();
}

async function main(){
    setupMenu();
    await createWindow();
}

ipcMain.handle('getViewConfig', async () => {
    return viewConfig;
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("ready",async()=>{
    await main()
});

