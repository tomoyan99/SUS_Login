const path = require("path");
const fs = require("fs");
const npmVersion = require("../../../package.json").version;
const __PREFIX = "resources/";
// const __PREFIX = "";
const termRC = {
    col:80,
    row:30
};
const infoPath = "data/info.json";
const confPath = path.resolve(__PREFIX,"userConfig.json");
let userConfig;

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
    userConfig = require(confPath);
}

module.exports = {
    npmVersion,
    __PREFIX,
    termRC,
    infoPath,
    confPath,
    userConfig
};


