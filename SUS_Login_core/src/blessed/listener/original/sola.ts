import Opener from "../../../puppeteer/BrowserOpener";
import {UIManager} from "../../ui/UIManager";

export async function sola(self: UIManager, node: { url: string }) {
    self.clearInfo();
    self.state.isChangeFocus = false;
    let BO = new Opener.BrowserOpener(self.data.user);
    try {
        BO = await BO.launch({
            is_headless: false,
            printFunc: self.appendInfo.bind(self),
            clearFunc: self.clearInfo.bind(self)
        }).catch(() => {
            self.eventService.emit(
                "error",
                "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります",
            );
            throw "";
        });
        BO.onClose(() => {
            self.appendInfo("{yellow-fg}[SOLA] ブラウザが閉じられました{/}");
        });
        await BO.open({mode: "SOLA", solaLink_URL: node.url});
    } catch (e) {
        self.eventService.emit("error", e);
    } finally {
        self.state.isChangeFocus = true;
    }
}