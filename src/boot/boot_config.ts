import path from "path";
import fs, {readFileSync} from "fs";
import {version as npmVersion} from "../../package.json";
import {app} from "electron";
import {ViewConfig} from "./types";

const userDataPath = app.getPath("userData");
const infoPath = path.join(userDataPath,"data/info.json");
const confPath = path.join(userDataPath,"userConfig.json");
const logFilePath = path.join(userDataPath,"data/euc.log");
const imagesDirPath = path.join(userDataPath,"data/images");

const inputFilePath = app.isPackaged
    ? path.join(process.resourcesPath,"EXE/main.exe")
    : path.join(app.getAppPath(),"EXE/main.exe");

process.env.appVersion = npmVersion;
process.env.userDataPath = userDataPath;
process.env.infoPath = infoPath;
process.env.confPath = confPath;
process.env.inputFilePath = inputFilePath;
process.env.imagesDirPath = imagesDirPath;
process.env.logFilePath = logFilePath;

let viewConfig:ViewConfig;
if (!fs.existsSync(confPath)){
    viewConfig = {
        defaultWindowSize: {
            width : 640,
            height: 480
        },
        defaultFontSize: 15,
        defaultTerminalSize:{
            cols:80,
            rows:30
        }
    }
    fs.writeFileSync(confPath,JSON.stringify(viewConfig),{encoding:"utf8"});
}else{
    viewConfig = <ViewConfig><unknown>JSON.parse(readFileSync(confPath,"utf8"));
}

export {
    npmVersion,
    viewConfig
};


