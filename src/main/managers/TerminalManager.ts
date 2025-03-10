import {app, BrowserWindow, ipcMain, ipcRenderer} from 'electron';
import * as pty from 'node-pty';
import {IpcManager} from "./IpcManager";
import {MyIPCEvents} from "../config/IpcEvents";


export class TerminalManager {
    private ptyProcess: pty.IPty | undefined;
    private ptyData: pty.IDisposable | undefined;
    private ptyExit: pty.IDisposable | undefined;
    private mainWindow: BrowserWindow | null = null;

    public async initialize(mainWindow: BrowserWindow | null) {
        if (mainWindow) {
            this.mainWindow = mainWindow;
        }else{
            throw new Error("Unable to initialize TerminalManager. mainWindow is null.");
        }
        this.mainWindow.webContents.on("dom-ready",async()=>{
            //前回のプロセスが残っていたら削除
            if (this.ptyProcess && this.ptyData && this.ptyExit) {
                await this.cleanupPreviousPtyProcess(this.ptyProcess,this.ptyData,this.ptyExit);
            }
            await this.createProcess();
        });
        await this.setupIpcListeners();
    }
    private async createProcess() {
        try {
            const cwdPath = '';
            this.ptyProcess = pty.spawn(<string>process.env.inputFilePath, [], {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd: cwdPath,
                env: process.env,
                handleFlowControl: true,
                useConpty: true,
            });
            this.ptyData = this.ptyProcess.onData((data) => {
                if (this.mainWindow)
                    IpcManager.sendToRenderer<MyIPCEvents,"terminal.incomingData">(this.mainWindow.webContents.id,'terminal.incomingData',data);
            });

            this.ptyExit = this.ptyProcess.onExit(() => {
                if (app.isPackaged && this.mainWindow) {
                    this.mainWindow.close();
                }
            });
        } catch (error) {
            if (this.mainWindow)
                IpcManager.sendToRenderer<MyIPCEvents,"terminal.incomingData">(this.mainWindow.webContents.id,'terminal.incomingData',error+"\n");
        }
    }

    private async cleanupPreviousPtyProcess(ptyProcess:pty.IPty,ptyData:pty.IDisposable,ptyExit:pty.IDisposable) {
        const PAUSE = "\x13";
        ptyProcess.write(PAUSE);
        ptyData.dispose();
        ptyExit.dispose();
        process.kill(ptyProcess.pid);
    }

    private async setupIpcListeners() {

        IpcManager.handleIPC<MyIPCEvents,"terminal.keystroke">("terminal.keystroke", async (_event, {key})=>{
            if (this.ptyProcess) this.ptyProcess.write(key);
        });
        IpcManager.handleIPC<MyIPCEvents,"terminal.resize">("terminal.resize", async (_event,{resizer})=>{
            if (this.ptyProcess) this.ptyProcess.resize(resizer[0], resizer[1]);
        });
    }
}
