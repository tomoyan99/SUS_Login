import path from "path";
import fs from "fs";
import {version as npmVersion} from "../../package.json";
type UserConfig = {
    "defaultWindowSize": {
        "width" : number,
        "height": number
    },
    "defaultFontSize": number,
    "defaultTerminalSize":{
        cols:number,
        rows:number,
    }
};
// const __PREFIX = "resources/";
const __PREFIX = "";
const termRC = {
    col:80,
    row:30
};
const infoPath = "data/info.json";
const confPath = path.resolve(__PREFIX,"src/boot/userConfig.json");
let userConfig:UserConfig;

if (!fs.existsSync(confPath)){
    userConfig = {
        "defaultWindowSize": {
            "width" : 820,
            "height": 640
        },
        "defaultFontSize": 17,
        "defaultTerminalSize":{
            cols:80,
            rows:30
        }
    }
    fs.writeFileSync(confPath,JSON.stringify(userConfig),{encoding:"utf8"});
}else{
    userConfig = <UserConfig><unknown>import(confPath);
}

export {
    npmVersion,
    __PREFIX,
    termRC,
    infoPath,
    confPath,
    userConfig
};


