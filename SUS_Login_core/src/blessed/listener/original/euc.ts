import {control as cl} from "../../../utils/control.js";
import {isObjEmpty} from "../../../utils/myUtils.js";
import {openContext, openEuc} from "../../../puppeteer/Openers.js";

export function euc(self) {
    const c = self.components;
    const f = c.form;
    self.setFocus(f);
    self.setInfo("EUCを入力してください\n{yellow-bg}{black-fg}*何も入力せずエンターキーを押すとコマンド選択に戻ります{/}")
    c.form.once("submit", () => {
        const value = self.status.inputValue;
        self.event.emit("confirm euc", value);
        self.status.inputValue = "";
    });
    c.form.once("cancel", () => {
        c.form.removeAllListeners("submit");
        self.event.removeAllListeners("confirm euc");
        c.form.removeAllListeners("cancel");
    });
    self.event.once("confirm euc", async (euc) => {
        let context
        self.setInfo("");
        let miss_count = 0;
        do {
            try {
                //ブラウザの起動
                context = await openContext("EUC").catch(() => {
                    self.event.emit("error", "[BROWSER\ ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
                    throw "";
                });
                //EUCの登録
                if (!isObjEmpty(await context.pages())) {
                    await openEuc(context, self._data.user, euc, self.appendInfo);
                }
                return;
            } catch (e) {
                //ミスした場合は0~3の全4回実行
                if (miss_count < 3) {
                    miss_count++;
                    self.appendInfo(`[EUC\ ERROR] ${cl.bg_yellow}${cl.fg_black}* 接続エラー${cl.bg_reset}${cl.fg_reset}(${miss_count})\n`);
                } else {
                    //4回やってもだめだったらエラー
                    self.event.emit("error", `[EUC\ ERROR]\n${cl.bg_red}*\ 4度接続を試みましたが失敗しました。${cl.bg_reset}\n${cl.bg_red}ネットワークを確認してください${cl.bg_reset}\n${e.stack}`);
                    await context.close();
                    return;
                }
            }
        } while (true);
    });
}