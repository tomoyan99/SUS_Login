import path from "path";
import nodeExternals from "webpack-node-externals"
import {importJSON} from "./src/utils/myUtils.js";
const pkjson = importJSON("package.json");
const filename = pkjson.name+"_v"+pkjson.version;

const config2 = {
    rules: [
        {
            // 拡張子 .ts の場合
            test: /\.ts$/,
            // TypeScript をコンパイルする
            use: 'ts-loader',
        },
    ],
    resolve: {
        // 拡張子を配列で指定
        extensions: [
            '.ts', '.js',
        ],
    },
    entry: {main:path.resolve("src/main/main.js")},
    output: {
        filename: `[name].cjs`,
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