import MainHome from "../../home/MainHome";
import Opener from "../../../puppeteer/BrowserOpener";

export async function sclass(self:MainHome) {
    self.clearInfo();
    self.status.isChangeFocus = false;
    let BO = new Opener.BrowserOpener(self.data.user);
    try {
        BO = await BO.launch({is_headless:false,printFunc:self.appendInfo.bind(self),clearFunc:self.clearInfo.bind(self)}).catch(()=>{
            self.event.emit(
                "error",
                "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります",
            );
            throw "";
        });
        BO.onClose(()=>{
           self.appendInfo("{yellow-fg}[SCLASS] ブラウザが閉じられました{/}");
        });
        await BO.open({mode:"SCLASS"});
    }catch (e) {
        self.event.emit("error",e);
    }finally {
        self.status.isChangeFocus = true;
    }
}