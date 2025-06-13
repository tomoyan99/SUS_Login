import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

// --- アプリケーション機能のインポート ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { BrowserOpener } from "./modules/puppeteer/BrowserOpener";
import { createSolaLinkData } from "./modules/puppeteer/createSolaLinkData";
import MyCrypt from "./modules/utils/MyCrypt";
import { NetWorkStatus } from "./modules/utils/NetWorkChecker";
import type { User, SolaLinkData } from "../types/setup";

// --- グローバル変数と定数 ---
let mainWindow: BrowserWindow | null = null;
let persistentBrowser: BrowserOpener | null = null; // S-CLASS/SOLA用の永続ブラウザ
const USER_DATA_FILE = "userdata.dat";
const myCrypt = new MyCrypt(join(app.getPath("userData"), USER_DATA_FILE), "university-portal-app", "user-credentials");
const netChecker = new NetWorkStatus();

/**
 * 🎨 レンダラープロセスにログを送信する関数
 */
function logToRenderer(message: any) {
  if (mainWindow) {
    const cleanedMessage = typeof message === 'string' ? message.replace(/\x1b\[[0-9;]*[mGKH]/g, '') : message;
    mainWindow.webContents.send("log:add", cleanedMessage);
  }
}

/**
 * 🔑 保存された認証情報を読み込み、復号して返す内部関数
 */
async function loadCredentials(): Promise<User | null> {
  try {
    const planeText = await myCrypt.readPlane();
    return JSON.parse(planeText) as User;
  } catch (error) {
    return null;
  }
}

/**
 * ⚙️ IPCハンドラを登録する関数
 */
function registerIpcHandlers() {
  // --- 認証情報管理 ---
  ipcMain.handle("credentials:save", async (_, user: User): Promise<void> => {
    await myCrypt.writeCrypt(user);
  });
  ipcMain.handle("credentials:load", async () => await loadCredentials());

  // --- 永続ブラウザ操作 ---
  const handleOpen = async (mode: "SCLASS" | "SOLA") => {
    const user = await loadCredentials();
    if (!user) throw new Error("ログイン情報が設定されていません。");

    if (persistentBrowser && persistentBrowser.browser?.isConnected()) {
      logToRenderer("ブラウザは既に開いています。");
      // TODO: 既存ウィンドウを最前面に表示するなどの処理
      return;
    }

    persistentBrowser = new BrowserOpener(user);
    // 要件1: Appモード、ヘッドフルで起動
    await persistentBrowser.launch({
      is_headless: false,
      is_app: true,
      printFunc: logToRenderer,
    });

    // ブラウザが閉じられたらインスタンスをnull化し、フロントエンドに通知
    persistentBrowser.onClose(() => {
      persistentBrowser = null;
      logToRenderer("ブラウザが閉じられました。");
      mainWindow?.webContents.send("browser:status-change", { isOpen: false });
    });

    await persistentBrowser.open({ mode });
    mainWindow?.webContents.send("browser:status-change", { isOpen: true });
  };

  ipcMain.handle("browser:sclass-open", () => handleOpen("SCLASS"));
  ipcMain.handle("browser:sola-open", () => handleOpen("SOLA"));

  ipcMain.handle("browser:persistent-close", async () => {
    if (persistentBrowser) {
      await persistentBrowser.close();
      persistentBrowser = null;
      // onCloseイベントでUIが更新されるので、ここでは不要
    }
  });

  // --- ヘッドレスでのブラウザ操作 ---
  async function performHeadlessOperation<T>(operation: (user: User, browserOpener: BrowserOpener) => Promise<T>): Promise<T> {
    const user = await loadCredentials();
    if (!user) throw new Error("ログイン情報が設定されていません。");

    const browserOpener = new BrowserOpener(user);
    try {
      // 要件2: ヘッドレスで起動
      await browserOpener.launch({
        is_headless: true,
        printFunc: logToRenderer
      });
      return await operation(user, browserOpener);
    } finally {
      await browserOpener.close();
      logToRenderer("ヘッドレスブラウザを正常に終了しました。");
    }
  }

  ipcMain.handle("browser:euc-register", async (_, eucCode: string) => {
    if (!eucCode) throw new Error("EUCコードが無効です。");
    return performHeadlessOperation(async (_user, opener) => {
      await opener.open({ mode: "EUC", EUC: eucCode });
      return "EUC登録処理が完了しました。";
    });
  });

  ipcMain.handle("browser:create-sola-link-data", async (): Promise<SolaLinkData> => {
    return performHeadlessOperation(async (user, _opener) => {
      // createSolaLinkData は opener ではなく user を第一引数に取るため、ここで渡す
      const solaLinkData = await createSolaLinkData(user, {
        is_headless: true,
        printFunc: logToRenderer,
      });
      return solaLinkData;
    });
  });

  // --- ネットワーク監視 ---
  netChecker.addEvent("connected", {id: "main-process-connected", listener: () => mainWindow?.webContents.send("network:status-change", true) });
  netChecker.addEvent("disconnected", {id: "main-process-disconnected", listener: () => mainWindow?.webContents.send("network:status-change", false) });

  ipcMain.on("network:start-monitoring", async () => {
    await netChecker.start();
    logToRenderer("ネットワーク監視を開始しました。");
  });

  ipcMain.on("network:stop-monitoring", async () => {
    await netChecker.stop();
    logToRenderer("ネットワーク監視を停止しました。");
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000, // 少し幅を広げました
    height: 720, // 少し高さを広げました
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron.university-portal-app");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  registerIpcHandlers();

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
