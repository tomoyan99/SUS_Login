import {isObjEmpty} from "../../../utils/myUtils.js";
import {openContext, openSclass, resizeWindow} from "../../../puppeteer/Openers.js";
import {control as cl} from "../../../utils/control.js";

export async function sclass(self, node) {
    self.setInfo("");
    let miss_count = 0;
    let context;
    try {
        context = await openContext("SCLASS");
    } catch (e) {
        self.event.emit("error", "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
        return;
    }
    do {
        try {
            //ページが開かれているならsclassを開く
            if (!isObjEmpty(await context.pages())) {
                const page = await openSclass(context, self._data.user, false, self.appendInfo)
                await resizeWindow(page, [1200, 700]);
            }
            break;
        } catch (e) {
            //ブラウザウィンドウが途中で閉じられた場合
            if (isObjEmpty(await context.pages())) {
                self.setInfo("{yellow-fg}[BROWSER\ INFO]\nブラウザが閉じられたことで中断されました{/}");
                await context.close();
                break;
            } else {
                //ミスした場合は0~3の全4回実行
                if (miss_count < 3) {
                    miss_count++;
                    self.appendInfo(`[SCLASS\ ERROR] ${cl.bg_yellow}${cl.fg_black}* 接続エラー${cl.bg_reset}${cl.fg_reset}(${miss_count})\n`);
                } else {
                    //4回やってもだめだったらエラー
                    self.event.emit("error", `[SCLASS\ ERROR]\n${cl.bg_red}* 4度接続を試みましたが失敗しました。${cl.bg_reset}\n${cl.bg_red}ネットワークを確認してください${cl.bg_reset}\n${e.stack}`);
                    await context.close();
                    break;
                }
            }
        }
    } while (true);
}