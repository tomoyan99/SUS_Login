// mainApp.ts - アプリケーションのエントリーポイント
import {UIManager} from "./UIManager";
import {SolaLinkData, User} from "../../main/setup";

/**
 * アプリケーションを初期化する
 * @param user ユーザー情報
 * @param links SOLAリンクデータ
 * @returns UIマネージャー
 */
export async function initApp(user: User, links: SolaLinkData): Promise<UIManager> {
    try {
        // UIマネージャーの作成と初期化
        const app = new UIManager(user, links);
        app.init();
        return app;
    } catch (e) {
        console.error("アプリケーションの初期化に失敗しました:", e);
        throw e;
    }
}
