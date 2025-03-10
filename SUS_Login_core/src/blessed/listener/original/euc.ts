import Opener from "../../../puppeteer/BrowserOpener";
import {UIManager} from "../../ui/UIManager";
import {Widgets} from "blessed";

export function euc(self: UIManager) {
    const c = self.components;
    const f = c.form;
    self.setFocus(f);
    self.setInfo(
        "EUCを入力してください\n{yellow-bg}{black-fg}*何も入力せずエンターキーを押すとコマンド選択に戻ります{/}",
    );
    c.form?.once("submit", () => {
        const value: string = self.state.inputValue;
        self.eventService.emit("confirm euc",self,value);
        self.state.inputValue = "";
    });
    c.form?.once("cancel", () => {
        c.form?.removeAllListeners("submit");
        self.eventService.removeAllListeners("confirm euc");
        c.form?.removeAllListeners("cancel");
    });
    self.eventService.once("confirm euc",registerEUC);
}

async function registerEUC (self:UIManager,euc: string) {
    // self.components.screen.onceKey(["C-[", "C-c"], (e) => {
    //
    // });
    self.clearInfo();
    self.state.isChangeFocus = false;
    let BO = new Opener.BrowserOpener(self.data.user);
    try {
        BO = await BO.launch({
            is_headless: true,
            printFunc: self.appendInfo.bind(self),
            clearFunc: self.clearInfo.bind(self)
        }).catch(() => {
            self.eventService.emit(
                "error",
                "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります",
            );
            throw "";
        });
        await BO.open({mode: "EUC", EUC: euc});
    } catch (e) {
        self.eventService.emit("error", e);
    } finally {
        await BO.close();
        self.state.isChangeFocus = true;
    }
}