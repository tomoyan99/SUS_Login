import path from "path";
import fs from "fs";
import nodeExternals from "webpack-node-externals"

const pkjson = JSON.parse(fs.readFileSync("./package.json"));
const filename = pkjson.name+"_v"+pkjson.version+".js";


const config = {
    entry: path.resolve(process.cwd(), "main.js"),  //エントリポイントであるファイルのパスを指定
    output: {
        path: path.resolve(process.cwd(), 'dist'),  //バンドルしたファイルの出力先のパスを指定
        filename: filename //出力時のファイル名の指定
    },
    target:"node",
    externals: [nodeExternals()],
}
export default config;
