// dataFormatter.ts - データを整形するクラス
import {description} from "../description/description";
import {mainEventMap} from "../commandList/commandList";
import {SolaLinkData, User} from "../../main/setup";
import {FormattedData, TreeEventMap, TreeNode} from "./UITypes";

/**
 * データフォーマッター
 * アプリケーションで使用するデータを整形するクラス
 */
export class DataFormatter {
    /**
     * データを整形する
     * @param user ユーザー情報
     * @param links SOLAリンクデータ
     * @returns 整形されたデータ
     */
    public static format(user: User, links: SolaLinkData): FormattedData {
        // 戻るリンクを追加
        links["{yellow-fg}戻る{/}"] = {event: "return"};

        return {
            user,
            main: this.treeingEventMap(mainEventMap),
            sub: this.treeingEventMap(links),
            description
        };
    }

    /**
     * イベントマップをツリー構造に変換する
     * @param EM イベントマップ
     * @param depth 現在の深さ
     * @returns ツリーノード
     */
    private static treeingEventMap(EM: Record<string, TreeEventMap | TreeEventMap[]>, depth: number = 0): TreeNode {
        const except_keys = ["event", "url", "name", "code"];
        let EM_treed: TreeNode =
            depth === 0
                ? {extended: true, children: {}}
                : Object.keys(EM).length > 0
                    ? {children: {}}
                    : {};

        for (const EM_key in EM) {
            if (except_keys.includes(EM_key)) {
                EM_treed[EM_key] = EM[EM_key];
            } else {
                EM_treed.children![EM_key] = this.treeingEventMap(
                    <Record<string, TreeEventMap>>EM[EM_key],
                    depth + 1
                );
            }
        }

        return EM_treed;
    }
}