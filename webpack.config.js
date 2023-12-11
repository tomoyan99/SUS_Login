import path from "path";
import nodeExternals from "webpack-node-externals"
import {importJSON} from "./src/terminal_processes/lib/utils/myUtils.js";

const pkjson = importJSON("package.json");
const filename = pkjson.name+"_v"+pkjson.version;

const config = {
    //エントリポイントであるファイルのパスを指定
    entry: {main:path.resolve("src/terminal_processes/main/main.js")},
    output: {
        path: path.resolve(process.cwd(),"bundle/"),  //バンドルしたファイルの出力先のパスを指定
        filename: `${filename}_[name].cjs` //出力時のファイル名の指定
    },
    target:"node",
    externals: [nodeExternals()],
}
export default config;
