import path from "path";
import fs, { readFileSync } from "fs";
import { version as npmVersion } from "../../../package.json";
import { app } from "electron";

const userDataPath = app.getPath("userData");

const paths = {
    info: path.join(userDataPath, "data/info.json"),
    config: path.join(userDataPath, "userConfig.json"),
    log: path.join(userDataPath, "data/euc.log"),
    images: path.join(userDataPath, "data/images"),
    inputFile: app.isPackaged
        ? path.join(process.resourcesPath, "dist/app_exe/main.exe")
        : path.join(app.getAppPath(), "dist/app_exe/main.exe"),
};

/**
 * 環境変数を設定する
 */
const setEnvironmentVariables = () => {
    process.env.appVersion = npmVersion;
    process.env.userDataPath = userDataPath;
    process.env.infoPath = paths.info;
    process.env.confPath = paths.config;
    process.env.inputFilePath = paths.inputFile;
    process.env.imagesDirPath = paths.images;
    process.env.logFilePath = paths.log;
};

type ViewConfig = {
    defaultWindowSize: {
        width : number,
        height: number
    },
    defaultFontSize: number,
    defaultTerminalSize:{
        cols:number,
        rows:number,
    },
    npmVersion:string
};

/**
 * 設定ファイルの読み込みまたは初期化
 * @returns {ViewConfig} 設定データ
 */
const loadOrInitializeConfig = (): ViewConfig => {
    const makeDefaultConfig = ():ViewConfig=>{
        const defaultConfig: ViewConfig = {
            defaultWindowSize: { width: 640, height: 480 },
            defaultFontSize: 15,
            defaultTerminalSize: { cols: 80, rows: 30 },
            npmVersion,
        };
        fs.writeFileSync(paths.config, JSON.stringify(defaultConfig, null, 2), { encoding: "utf8" });
        return defaultConfig;
    }

    if (!fs.existsSync(paths.config)) {
        return makeDefaultConfig();
    }

    try {
        const requiredKeys: Array<keyof ViewConfig> = [
            "defaultTerminalSize",
            "defaultFontSize",
            "defaultWindowSize",
            "npmVersion"
        ];
        const parsedConfig = JSON.parse(readFileSync(paths.config, "utf8"));
        const hasAllProperties = requiredKeys.every(key => key in parsedConfig);
        if (hasAllProperties) {
            return parsedConfig as ViewConfig;
        }else{
            throw new Error("");
        }
    } catch (error) {
        return makeDefaultConfig();
    }
};

// 初期化処理
setEnvironmentVariables();
const viewConfig = loadOrInitializeConfig();

export default viewConfig;
