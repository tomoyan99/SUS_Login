import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

// --- アプリケーション機能のインポート ---
// 提供されたモジュールへのパスを解決します。実際のプロジェクト構造に合わせて調整してください。
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { BrowserOpener, LaunchOption } from "../test/modules/puppeteer/BrowserOpener";
import { createSolaLinkData } from "../test/modules/puppeteer/createSolaLinkData";
import MyCrypt from "../test/modules/utils/MyCrypt";
import { NetWorkStatus } from "../test/modules/utils/NetWorkChecker";
import type { User, SolaLinkData } from "../test/modules/types/setup";

// --- グローバル変数と定数 ---
let mainWindow: BrowserWindow | null = null;
const USER_DATA_FILE = "userdata.dat";
const myCrypt = new MyCrypt(join(app.getPath("userData"), USER_DATA_FILE), "university-portal-app", "user-credentials");
const netChecker = new NetWorkStatus();

/**
 * 🎨 レンダラープロセスにログを送信する関数
 * @param message 送信するメッセージ
 */
function logToRenderer(message: any) {
  if (mainWindow) {
    // ANSIエスケープコード（コンソールの色付け用）を除去して送信
    const cleanedMessage = typeof message === 'string' ? message.replace(/\x1b\[[0-9;]*[mGKH]/g, '') : message;
    mainWindow.webContents.send("log:add", cleanedMessage);
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

  ipcMain.handle("credentials:load", async (): Promise<User | null> => {
    try {
      const planeText = await myCrypt.readPlane();
      return JSON.parse(planeText) as User;
    } catch (error) {
      // ファイルが存在しない、または復号に失敗した場合
      return null;
    }
  });

  // --- ブラウザ操作 ---
  const defaultLaunchOption: LaunchOption = {
    is_headless: false,
    is_app: false,
    is_secret: true,
    printFunc: logToRenderer,
  };

  /**
   * ブラウザ操作の共通ロジック
   * @param operation ブラウザで行う操作のコールバック
   */
  async function performBrowserOperation<T>(operation: (user: User, browserOpener: BrowserOpener) => Promise<T>): Promise<T> {
    const user = await ipcMain.handle("credentials:load")();
    if (!user) {
      throw new Error("ログイン情報が保存されていません。");
    }
    const browserOpener = new BrowserOpener(user);
    try {
      await browserOpener.launch(defaultLaunchOption);
      return await operation(user, browserOpener);
    } finally {
      await browserOpener.close();
      logToRenderer("✅ ブラウザを正常に終了しました。");
    }
  }

  ipcMain.handle("browser:sclass-login", async () => {
    return performBrowserOperation(async (_, browserOpener) => {
      await browserOpener.open({ mode: "SCLASS" });
      return "S-CLASSに正常にログインしました。";
    });
  });

  ipcMain.handle("browser:sola-login", async () => {
    return performBrowserOperation(async (_, browserOpener) => {
      await browserOpener.open({ mode: "SOLA" });
      return "SOLAに正常にログインしました。";
    });
  });

  ipcMain.handle("browser:euc-register", async (_, eucCode: string) => {
    if (!eucCode || typeof eucCode !== 'string') {
      throw new Error("EUCコードが無効です。");
    }
    return performBrowserOperation(async (_, browserOpener) => {
      await browserOpener.open({ mode: "EUC", EUC: eucCode });
      return "EUC登録処理が完了しました。";
    });
  });

  ipcMain.handle("browser:create-sola-link-data", async (): Promise<SolaLinkData> => {
    logToRenderer("履修データ生成を開始します。処理には数分かかる場合があります...");
    const user = await ipcMain.handle("credentials:load")();
    if (!user) {
      throw new Error("ログイン情報が保存されていません。");
    }
    // この処理は内部でブラウザの起動・終了を行うため、performBrowserOperationは使わない
    const solaLinkData = await createSolaLinkData(user, {
      ...defaultLaunchOption,
      is_headless: true, // バックグラウンドで実行
    });
    logToRenderer("✅ 履修データの生成が完了しました。");
    return solaLinkData;
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
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true, // セキュリティのためtrueを推奨
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron.university-portal-app");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPCハンドラを登録
  registerIpcHandlers();

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
