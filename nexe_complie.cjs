const pkg = require("./package.json")
const {compile} = require("nexe");

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
    input: `bundle/main.cjs`,
    output: `./EXE/main.exe`,
    python: "C:/Python312/python.exe",
    // build:true,
    targets:["14.15.3"],
    name:appName,
    rc: Object.assign({
        'PRODUCTVERSION': ver,
        'FILEVERSION': ver,
    }, rc),
    flags: {
        "--title":appName
    },
    mangle:true
})