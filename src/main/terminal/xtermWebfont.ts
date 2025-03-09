import FontFaceObserver from "fontfaceobserver";
import {Terminal} from "xterm";

/**
 * xterm.jsにWebフォントの読み込み機能を追加するユーティリティクラス
 */
class XtermWebfont {
    private terminal?: Terminal;

    /**
     * 指定されたターミナルインスタンスにWebフォント読み込み機能を有効化します。
     * @param terminal - xterm.jsのTerminalインスタンス
     */
    activate(terminal: Terminal): void {
        this.terminal = terminal;

        // ターミナルに `loadWebfontAndOpen` メソッドを追加
        terminal.loadWebfontAndOpen = async function (element: HTMLElement): Promise<Terminal> {
            const fontFamily = this.options.fontFamily;

            if (!fontFamily) {
                throw new Error("ターミナルオプションでフォントファミリーが指定されていません。");
            }

            try {
                // 通常フォントとボールドフォントの読み込みを開始
                const regularFont = new FontFaceObserver(fontFamily).load();
                const boldFont = new FontFaceObserver(fontFamily, { weight: "bold" }).load();

                // 両方のフォントが読み込まれるのを待つ
                await Promise.all([regularFont, boldFont]);

                // 指定されたHTML要素にターミナルを表示
                this.open(element);
            } catch {
                // フォント読み込みに失敗した場合はCourierフォントにフォールバック
                console.warn(`フォント "${fontFamily}" の読み込みに失敗しました。"Courier" にフォールバックします。`);
                this.options.fontFamily = "Courier";
                this.open(element);
            }

            return this;
        };
    }

    /**
     * Webフォント拡張を無効化し、追加したプロパティやメソッドをクリーンアップします。
     */
    dispose(): void {
        if (this.terminal && 'loadWebfontAndOpen' in this.terminal) {
            delete (this.terminal as any).loadWebfontAndOpen;
        }
    }
}
// Terminalインターフェースを拡張して、新しいメソッドを追加
declare module "xterm" {
    interface Terminal {
        loadWebfontAndOpen(element: HTMLElement): Promise<Terminal>;
    }
}


export default XtermWebfont;