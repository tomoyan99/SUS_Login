import {compile} from "nexe";
import fs from "fs";
import pkg from "./package.json" assert {type:"json"}


const ver = pkg.version;
const appName = `SUS_Login_v${ver}`;
const rc = {
    'CompanyappName': "Tomoya Sano",
    'ProductappName': "Unchi",
    'FileDescription': "Smart Login Application for SUS",
    'FileVersion': `${ver}`,
    'ProductVersion': `${ver}`,
    'OriginalFileappName': "SUS_Login.exe",
    'InternalappName': "suslogin",
    'LegalCopyright': ""
};

compile({
    input: `./bundle/sus_login_v${ver}_main.cjs`,
    output: `./nexe/SUS_Login_v${ver}.exe`,
    python: "C:/Python312/python.exe",
    build: true, //required to use patches
    name:`SUS_Login_v${ver}`,
    patches: [
        async (compiler, next) => {
            await compiler.setFileContentsAsync(
                'lib/new-native-module.js',
                'module.exports = 42'
            )
            return next()
        }
    ],
    rc: Object.assign({
        'PRODUCTVERSION': ver,
        'FILEVERSION': ver,
    }, rc),
    flags: {
        "--title":appName
    }
})