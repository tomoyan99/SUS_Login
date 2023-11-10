import path from "path";
import nodeExternals from "webpack-node-externals"
import {importJSON} from "./resource/util/importJSON.js";

const pkjson = importJSON("./package.json");
const filename = pkjson.name+"_v"+pkjson.version;


const config = {
    entry:
        {
            main:path.resolve(process.cwd(), "main.js"),
            resetInfo:path.resolve(process.cwd(), "util/resetInfo.mjs")
        },  //エントリポイントであるファイルのパスを指定
    output: {
        path: path.resolve(process.cwd()),  //バンドルしたファイルの出力先のパスを指定
        filename: `${filename}_[name].cjs` //出力時のファイル名の指定
    },
    target:"node",
    externals: [nodeExternals()],
}
export default config;
