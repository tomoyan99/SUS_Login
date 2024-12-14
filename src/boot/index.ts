import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from "electron";
import * as pty from "node-pty";
import path from "path";
import { confPath, npmVersion, viewConfig } from "./boot_config";
import fs, {appendFileSync, writeFileSync} from "fs";
import {ITerminalOptions} from "xterm";
import {susLoginCore} from "../../SUS_Login_core/src/main/main"
import {StdoutCapture} from "../../SUS_Login_core/src/utils/StdoutCapture";
import MainHome from "../../SUS_Login_core/src/blessed/home/MainHome";

let mainWindow: BrowserWindow | null = null;
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

    // mainWindow.webContents.on("dom-ready", initializeTerminalProcess);
    mainWindow.webContents.on("dom-ready",aaaa);
}

// ウィンドウのクローズ処理
function handleWindowClose() {
    ipcMain.once("terminal.sendOptions", (event, options) => {
        // ウィンドウの設定を保存
        if (mainWindow) {
            saveWindowConfig(options);
            // mainWindow.close();
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
    fs.writeFileSync(confPath, JSON.stringify(viewConfig,null,2), { encoding: "utf8" });
}

async function aaaa() {
    console.clear();
    const capture = new StdoutCapture();
    writeFileSync("./log.log","");
    // キャプチャ中のデータをリアルタイムで処理するリスナーを設定
    capture.on("data", (data: string) => {
        appendFileSync("./log.log",`${new Date()} [Captured]: ${data.trim()}\n`);
        mainWindow?.webContents.send("terminal.incomingData", data);
    });

    // キャプチャを開始
    capture.startCapturing();

    // メイン関数を実行
    new MainHome({user:{username:"T122063",password:"pz2Gqb9!"},links:{
        "前期":{},
        "後期":{}
    }});

    // キャプチャを終了
    const capturedOutput = capture.stopCapturing();
}


// ターミナルプロセスの初期化
function initializeTerminalProcess() {
    let ptyProcess: pty.IPty|undefined;
    let ptyData: pty.IDisposable|undefined;
    let ptyExit: pty.IDisposable|undefined;

    if (ptyProcess && ptyData && ptyExit) {
        cleanupPreviousPtyProcess(ptyProcess,ptyData,ptyExit);
    }
    try {
        const inputFilePath = path.join(__dirname, `../../EXE/main.exe`);
        const cwdPath = "";
        ptyProcess = pty.spawn(inputFilePath, [], {
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
        { label: 'DevTool', role: "toggleDevTools" },
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

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("ready",async()=>{
    await main()
});

