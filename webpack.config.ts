import path from "path";
import nodeExternals from "webpack-node-externals";
import { Configuration, RuleSetRule} from "webpack"; // 型をインポート
import pkj from "./package.json";

const filename = `${pkj.name}_v${pkj.version}`;

const config2: Configuration = {
    module: {
        rules: [
            {
                // 拡張子 .ts の場合
                test: /\.ts$/,
                // TypeScript をコンパイルする
                use: "ts-loader",
            } as RuleSetRule,
        ],
    },
    resolve: {
        // 拡張子を配列で指定
        extensions: [".ts", ".js"],
    },
    entry: { main: path.resolve("SUS_Login_core/src/main/main.ts") },
    output: {
        filename: `[name].cjs`,
        path: path.resolve(process.cwd(), "dist/webpack_bundle"),
        library: {
            type: "commonjs",
        },
        // chunkFormat や format の設定を追加
    },
    target: "node",
    mode: "production",
    // mode: "development",
    externals: [<any>nodeExternals()], // Node.js モジュールを除外
};

export default config2;
