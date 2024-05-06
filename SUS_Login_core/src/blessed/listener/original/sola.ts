import {
  openContext,
  openSola,
  resizeWindow,
} from "../../../puppeteer/Openers.js";
import { isObjEmpty } from "../../../utils/myUtils.js";
import { control as cl } from "../../../utils/control.js";

export async function sola(self, node) {
  self.setInfo("");
  let miss_count = 0;
  let context;
  try {
    context = await openContext("SOLA");
  } catch (e) {
    self.event.emit(
      "error",
      "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります",
    );
    return;
  }
  do {
    try {
      if (!isObjEmpty(await context.pages())) {
        const page = await openSola(
          context,
          self._data.user,
          false,
          node.url,
          self.appendInfo,
        );
        await resizeWindow(page, [1200, 700]);
      }
      return;
    } catch (e) {
      //ブラウザウィンドウが途中で閉じられた場合
      if (isObjEmpty(await context.pages())) {
        self.setInfo(
          "{yellow-fg}[BROWSER INFO]\nブラウザが閉じられたことで中断されました{/}",
        );
        return;
      }
      //ミスした場合は0~3の全4回実行
      if (miss_count < 3) {
        miss_count++;
        self.appendInfo(
          `[SOLA\ ERROR] ${cl.bg_yellow}${cl.fg_black}* 接続エラー${cl.bg_reset}${cl.fg_reset}(${miss_count})`,
        );
      } else {
        //4回やってもだめだったらエラー
        self.event.emit(
          "error",
          `[SOLA　ERROR]\n${cl.bg_red}* 4度接続を試みましたが失敗しました。${cl.bg_reset}\n${cl.bg_red}ネットワークを確認してください${cl.bg_reset}\n${e.stack}`,
        );
        await context.close();
        return;
      }
    }
  } while (true);
}