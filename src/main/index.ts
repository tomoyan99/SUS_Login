import { app } from 'electron';
import {AppManager} from "./managers/AppManager";
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', async () => {
    const appInstance = new AppManager();
    await appInstance.start();
});

