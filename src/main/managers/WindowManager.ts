import { BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import viewConfig from '../config/viewConfig';
import { ITerminalOptions } from 'xterm';
import fs from "fs";
import {IpcManager} from "./IpcManager";
import {MyIPCEvents} from "../config/IpcEvents";

export class WindowManager {
    private mainWindow: BrowserWindow | null = null;

    public async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: viewConfig.defaultWindowSize.width,
            height: viewConfig.defaultWindowSize.height,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, '../terminal/preload.js'),
                disableDialogs: true,
            },
            backgroundColor: '#000',
            minWidth: 300,
            minHeight: 300,
            useContentSize: true,
            title: `SUS_Login_v${viewConfig.npmVersion}`,
        });

        if (this.mainWindow) {
            this.setupWindowEvents();
            IpcManager.handleIPC<MyIPCEvents,"getViewConfig">("getViewConfig",async ()=>{
                return viewConfig;
            });
        }
    }

    public async loadContent() {
        if (this.mainWindow) {
            await this.mainWindow.loadURL(`file://${__dirname}/../render/index.html`);
            this.mainWindow.focus();
        }
    }

    public setupMenu() {
        const mainMenu: MenuItemConstructorOptions[] = [
            { label: '再起動', role: 'reload' },
            { label: 'フォント', submenu: [
                    { label: '文字大きく', click: () => { this.changeFontSize(1); }, accelerator: 'CmdOrCtrl+=' },
                    { label: '初期値', click: () => { this.resetFontSize(); } },
                    { label: '文字小さく', click: () => { this.changeFontSize(-1); }, accelerator: 'CmdOrCtrl+-' }
                ]},
            {label:"devtools",role:"toggleDevTools"}
        ];

        const menu = Menu.buildFromTemplate(mainMenu);
        Menu.setApplicationMenu(menu);
    }

    private setupWindowEvents() {
        if (!this.mainWindow) return;

        this.mainWindow.once('close', (e) => {
            e.preventDefault();
            this.handleWindowClose();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    private handleWindowClose() {
        if (!this.mainWindow)return;
        IpcManager.handleIPC<MyIPCEvents,'terminal.sendOptions'>('terminal.sendOptions', (_event, options) => {
            this.saveWindowConfig(options);
            this.mainWindow?.destroy();
        });
        IpcManager.sendToRenderer<MyIPCEvents,'terminal.requestOptions'>(this.mainWindow.webContents.id,'terminal.requestOptions');
    }

    private changeFontSize(sizeChange: number | 'default') {
        if (this.mainWindow)
            IpcManager.sendToRenderer<MyIPCEvents,"terminal.fontsize">(this.mainWindow.webContents.id,"terminal.fontsize",sizeChange);
    }

    private resetFontSize() {
        if (this.mainWindow)
            IpcManager.sendToRenderer<MyIPCEvents,'terminal.fontsize'>(this.mainWindow.webContents.id,'terminal.fontsize', 'default');
    }

    private saveWindowConfig(options: ITerminalOptions) {
        if (!this.mainWindow)return;
        const contentSize = this.mainWindow.getContentSize() as [number,number];
        viewConfig.defaultWindowSize.width = contentSize ? contentSize[0] : viewConfig.defaultWindowSize.width;
        viewConfig.defaultWindowSize.height = contentSize ? contentSize[1] : viewConfig.defaultWindowSize.height;
        viewConfig.defaultFontSize = options.fontSize ?? 17;
        fs.writeFileSync(<string>process.env.confPath, JSON.stringify(viewConfig), { encoding: 'utf8' });
    }

    public getMainWindow() {
        return this.mainWindow;
    }
}
