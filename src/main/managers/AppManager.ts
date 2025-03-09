import { WindowManager } from './WindowManager';
import { TerminalManager } from './TerminalManager';

export class AppManager {
    private windowManager: WindowManager | null;
    private terminalManager: TerminalManager | null;

    constructor() {
        this.windowManager = new WindowManager();
        this.terminalManager = new TerminalManager();

    }

    public async start() {
        if (this.terminalManager && this.windowManager) {
            this.windowManager.setupMenu();
            await this.windowManager.createWindow();
            await this.terminalManager.initialize(this.windowManager.getMainWindow());
        }
    }
}