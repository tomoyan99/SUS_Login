import {compile} from "nexe"
import {importJSON} from "./src/terminal_processes/lib/utils/myUtils.js";
import rcedit from "rcedit";
import fs from "fs";

const pkg = importJSON("package.json");
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

async function exists(filename) {
    try {
        return (await fs.promises.stat(filename)).size > 0
    } catch{ }
    return false;
}

compile({
    input: `./bundle/sus_login_v${ver}_main.cjs`,
    output: `./nexe/SUS_Login_v${ver}.exe`,
    python: "C:/Python311/",
    targets:"windows-x64-14.15.3",
    name:`SUS_Login_v${ver}`,
    // rc: Object.assign({
    //     'PRODUCTVERSION': ver,
    //     'FILEVERSION': ver,
    // }, rc),
    // flags: {
    //     "--title":appName
    // }
})