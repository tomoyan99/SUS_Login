import {app, BrowserWindow, ipcMain, ipcRenderer} from 'electron';
import * as pty from 'node-pty';
import {IpcManager} from "./IpcManager";

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
        //前回のプロセスが残っていたら削除
        if (this.ptyProcess && this.ptyData && this.ptyExit) {
            this.cleanupPreviousPtyProcess(this.ptyProcess,this.ptyData,this.ptyExit);
        }

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
                if (this.mainWindow) this.mainWindow.webContents.send('terminal.incomingData', data);
            });

            this.ptyExit = this.ptyProcess.onExit(() => {
                if (app.isPackaged && this.mainWindow) {
                    this.mainWindow.close();
                }
            });
            this.setupIpcListeners();
        } catch (error) {
            if (this.mainWindow) this.mainWindow.webContents.send('terminal.incomingData', error + '\n');
        }
    }

    private cleanupPreviousPtyProcess(ptyProcess:pty.IPty,ptyData:pty.IDisposable,ptyExit:pty.IDisposable) {
        const PAUSE = "\x13";
        IpcManager.removeAllIPC("terminal.keystroke");
        IpcManager.removeAllIPC("terminal.resize");
        ptyProcess.write(PAUSE);
        ptyData.dispose();
        ptyExit.dispose();
        process.kill(ptyProcess.pid);
    }

    private setupIpcListeners() {
        IpcManager.handleIPC("terminal.keystroke", async (_event, {key})=>{
            if (this.ptyProcess) this.ptyProcess.write(key);
        });
        IpcManager.handleIPC("terminal.resize", async (_event,{resizer})=>{
            if (this.ptyProcess) this.ptyProcess.resize(resizer[0], resizer[1]);
        });
    }
}
