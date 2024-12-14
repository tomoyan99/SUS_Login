import path from "path";
import fs, {readFileSync} from "fs";
import {version as npmVersion} from "../../package.json";

type ViewConfig = {
    defaultWindowSize: {
        width : number,
        height: number
    },
    defaultFontSize: number,
    defaultTerminalSize:{
        cols:number,
        rows:number,
    }
};
const __PREFIX = __dirname;
const termRC = {
    col:80,
    row:30
};
const infoPath = "data/info.json";
const confPath = path.join(__dirname,"userConfig.json");
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
    termRC,
    infoPath,
    confPath,
    viewConfig
};


