import {compile} from "nexe"
import {importJSON} from "./lib/utils/importJSON.js";
import rcedit from "rcedit";

const pkg = importJSON("package.json");
const ver = pkg.version;
const iconPass = "icon.ico";
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
    input: `./sus_login_v${ver}_main.cjs`,
    output: `./SUS_Login_v${ver}.exe`,
    python: 'C:/Users/tomoy/anaconda3/',
    // loglevel: 'verbose',
    build:true,
    ico:iconPass,
    targets:"windows-x64-14.15.3",
    name:`SUS_Login_v${ver}`,
    patches: [
        async (compiler, next) => {
            // await compiler.setFileContentsAsync(
            //     'lib/new-native-module.js',
            //     'module.exports = 42'
            // );
            const exePath = compiler.getNodeExecutableLocation();
            if (await exists(exePath)) {
                await rcedit(exePath, {
                    'version-string': rc,
                    'file-version': ver,
                    'product-version': ver,
                    icon: iconPass,
                });
            }
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
    // clean:true
}).then(() => {
    console.log('success')
})