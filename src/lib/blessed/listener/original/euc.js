import {control as cl} from "../../../utils/control.js";
import {isObjEmpty} from "../../../utils/myUtils.js";
import {openContext, openEuc} from "../../../puppeteer/Openers.js";

export function euc(self,node) {
    const c = self.components;
    const f = c.form;
    self.status.miss_count = 0;
    c.form.once("focus",()=>{
        c.form.once("submit",()=>{
            const value = self.status.inputValue;
            self.event.emit("change input",value);
            self.status.inputValue = "";
        });
        c.form.on("keypress",(ch,key)=>{
            const keyn = key.name;

            switch (keyn) {
                case "backspace":
                    if (self.status.inputValue.length === 0){
                        c.form.setValue("入力 >>  ");
                    }else{
                        self.status.inputValue = self.status.inputValue.slice(0,-1);
                    }
                    break;
                case "escape":
                    c.form.cancel();
                    c.form.clearValue();
                    self.setFocus(self.components.mainTree)
                    break;
                case "enter":
                    if (self.status.inputValue.length > 0){
                        c.form.submit();
                        c.form.clearValue();
                        self.setFocus(self.components.mainTree);
                        self.setFocus(self.components.info);
                    }else{
                        self.setFocus(self.components.mainTree)
                    }
                    break;
                case "return":
                    break;
                default:
                    //制御文字とバックスラッシュは除外
                    const cond = (
                        key.full.charCodeAt(0) >= 33
                        && key.full.charCodeAt(0) <= 126
                        && key.full.charCodeAt(0) !== 92
                        && key.full !== "space"
                    );
                    if (cond){
                        self.status.inputValue += (key.sequence)?key.sequence:key.ch;
                    }
                    break;
            }
        })
        c.form.setValue("入力 >> ");
        self.status.inputValue = "";
        self.components.screen.render();
    })
    c.form.once("blur",()=>{
        c.form.removeAllListeners("keypress")
    })
    self.setFocus(f);
    self.event.once("change input",async(euc)=>{
        self.setInfo("");
        let context;
        try{
            context = await openContext("EUC");
        }catch (e) {
            self.event.emit("error","[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
            return;
        }
        do {
            try {
                if (!isObjEmpty(context.targets())){
                    const page = await openEuc(context,self._data.user,euc,self.appendInfo)
                    await context.close();
                }
                return;
            }catch (e) {
                if (isObjEmpty(context.targets())){
                    self.setInfo("{yellow-fg}[BROWSER INFO]\nブラウザが閉じられたことで中断されました{/}");
                    return;
                }
                self.appendInfo(`[EUC　ERROR] ${cl.bg_yellow}${cl.fg_black}※ 接続エラー${cl.bg_reset}${cl.fg_reset}(${self.status.miss_count+1})\n`);
                self.status.miss_count++;
                if (self.status.miss_count === 4){
                    self.event.emit("error",
                        `[EUC　ERROR]\n${cl.bg_red}※ 4度接続を試みましたが失敗しました。${cl.bg_reset}\n${cl.bg_red}ネットワークを確認してください${cl.bg_reset}\n${e.stack}`);
                    self.status.miss_count = 0;
                    return;
                }
            }
        }while (true);
    });
}