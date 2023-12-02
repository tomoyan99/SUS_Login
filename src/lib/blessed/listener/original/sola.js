import {openContext, openSola, resizeWindow} from "../../../puppeteer/Openers.js";
import {isObjEmpty} from "../../../utils/myUtils.js";
import {control as cl} from "../../../utils/control.js";

export async function sola(self,node) {
    self.setInfo("");
    self.status.miss_count = 0;
    let context;
    try{
        context = await openContext("SOLA")
    }catch (e) {
        self.event.emit("error","[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
        return;
    }
    do {
        try {
            if (!isObjEmpty(context.targets())){
                const page = await openSola(context,self._data.user,false,node.url,self.appendInfo)
                await resizeWindow(page,[1200,700]);
            }
            return;
        }catch (e) {
            if (isObjEmpty(context.targets())){
                self.setInfo("{yellow-fg}[BROWSER INFO]\nブラウザが閉じられたことで中断されました{/}");
                return
            }
            self.appendInfo(`[SOLA\ ERROR] ${cl.bg_yellow}${cl.fg_black}* 接続エラー${cl.bg_reset}${cl.fg_reset}(${self.status.miss_count+1})`);
            self.status.miss_count++;
            if (self.status.miss_count === 4){
                self.event.emit("error",`[SOLA　ERROR]\n${cl.bg_red}* 4度接続を試みましたが失敗しました。${cl.bg_reset}\n${cl.bg_red}ネットワークを確認してください${cl.bg_reset}\n${e.stack}`);
                await context.close();
                self.status.miss_count = 0;
                return;
            }
        }
    }while (true);
}