import {App} from "electron";
import getPort from "get-port";

export const getDebuggerPort = async (app:App,port = 0): Promise<number> => {
    const actualPort = port === 0 ? await getPort({ host: "127.0.0.1" }) : port;

    app.commandLine.appendSwitch("remote-debugging-port", `${actualPort}`);
    app.commandLine.appendSwitch("remote-debugging-address", "127.0.0.1");

    const electronMajor = parseInt(app.getVersion().split(".")[0], 10);
    if (electronMajor >= 7) {
        app.commandLine.appendSwitch("enable-features", "NetworkService");
    }

    return actualPort;
};
