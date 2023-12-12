import path from "path";
import nodeExternals from "webpack-node-externals"
import {importJSON} from "./src/terminal_processes/lib/utils/myUtils.js";
import WebpackObfuscator from "webpack-obfuscator";

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
// export default config;

const config2 = {
    entry: {main:path.resolve("src/terminal_processes/main/main.js")},
    output: {
        filename: `${filename}_[name].cjs`,
        path: path.resolve(process.cwd(),"bundle/"),
        library: {
            type: 'commonjs',
        },
        // chunkFormat や format の設定を追加
    },
    target: 'node',
    mode: 'production',
    // mode: 'development',
    externals: [nodeExternals()], // Node.js モジュールを除外
};

export default config2;