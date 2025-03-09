import pkg from "./package.json";
import {compile} from "nexe";

const ver = pkg.version;
const appName = `SUS_Login_v${ver}`;
const rc = {
    'CompanyappName': "Tomoya Sano",
    'ProductappName': "SUS_Login",
    'FileDescription': "Smart Login Application for SUS",
    'FileVersion': `${ver}`,
    'ProductVersion': `${ver}`,
    'OriginalFileappName': "SUS_Login.exe",
    'InternalappName': "suslogin",
    'LegalCopyright': ""
};

compile({
    input: `dist/webpack_bundle/main.cjs`,
    output: `dist/app_exe/main.exe`,
    python: "C:/Python312/python.exe",
    build:true,
    targets:["20.18.1"],
    // targets:["14.15.3"],
    verbose:true,
    name:appName,
    rc: Object.assign({
        'PRODUCTVERSION': ver,
        'FILEVERSION': ver,
    }, rc),
    // flags: ["--title=appName"],
    mangle:true
})