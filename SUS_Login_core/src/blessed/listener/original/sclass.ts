import {UIManager} from "../../ui/UIManager";
import Opener from "../../../puppeteer/BrowserOpener";

export async function sclass(self: UIManager) {
    self.clearInfo();
    self.state.isChangeFocus = false;
    let BO = new Opener.BrowserOpener(self.data.user);
    try {
        // 起動エラー
        try {
            BO = await BO.launch({
                is_headless: false,
                printFunc: self.appendInfo.bind(self),
                clearFunc: self.clearInfo.bind(self)
            });
        } catch (launchError) {
            const errorMessage = "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります";
            throw new Error(errorMessage);
        }

        BO.onClose(() => {
            self.appendInfo("{yellow-fg}[SCLASS] ブラウザが閉じられました{/}");
        });
        await BO.open({mode: "SCLASS"});
    } catch (e) {
        self.eventService.emit("error", e);
    } finally {
        self.state.isChangeFocus = true;
    }
}