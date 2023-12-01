import {isObjEmpty} from "../../../utils/myUtils.js";
import {openContext, openSclass, resizeWindow} from "../../../puppeteer/Openers.js";
import {control as cl} from "../../../utils/control.js";

export async function sclass(self,node) {
    self.setInfo("");
    self.status.miss_count = 0;
    let context;
    try{
        context = await openContext("SCLASS");
        context.on("close",()=>{

        })
    }catch (e) {
        self.event.emit("error","[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
        return;
    }
    do {
        try {
            if (!isObjEmpty(context.targets())){
                const page = await openSclass(context,self._data.user,false,self.appendInfo)
                await resizeWindow(page,[1200,700]);
                await context.close();
            }
            return;
        }catch (e) {
            if (isObjEmpty(context.targets())){
                self.setInfo("{yellow-fg}[BROWSER INFO]\nブラウザが閉じられたことで中断されました{/}");
                return
            }
            self.appendInfo(`[SCLASS　ERROR] ${cl.bg_yellow}${cl.fg_black}※ 接続エラー${cl.bg_reset}${cl.fg_reset}(${self.status.miss_count+1})\n`);
            self.status.miss_count++;
            if (self.status.miss_count === 4){
                self.event.emit("error",`[SCLASS　ERROR]\n${cl.bg_red}※ 4度接続を試みましたが失敗しました。${cl.bg_reset}\n${cl.bg_red}ネットワークを確認してください${cl.bg_reset}\n${e.stack}`);
                await context.close();
                self.status.miss_count = 0;
                return;
            }
        }
    }while (true);
}