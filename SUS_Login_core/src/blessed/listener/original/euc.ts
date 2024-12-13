import MainHome from "../../home/MainHome";
import Opener from "../../../puppeteer/BrowserOpener";

export function euc(self:MainHome) {
  const c = self.components;
  const f = c.form;
  self.setFocus(f);
  self.setInfo(
    "EUCを入力してください\n{yellow-bg}{black-fg}*何も入力せずエンターキーを押すとコマンド選択に戻ります{/}",
  );
  c.form.once("submit", () => {
    const value:string = self.status.inputValue;
    self.event.emit("confirm euc", value);
    self.status.inputValue = "";
  });
  c.form.once("cancel", () => {
    c.form.removeAllListeners("submit");
    self.event.removeAllListeners("confirm euc");
    c.form.removeAllListeners("cancel");
  });
  self.event.once("confirm euc", async (euc:string) => {
    self.clearInfo();
    let BO = new Opener.BrowserOpener(self.data.user);
    try {
      BO = await BO.launch({is_headless:true,printFunc:self.appendInfo.bind(self),clearFunc:self.clearInfo.bind(self)}).catch(()=>{
        self.event.emit(
            "error",
            "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります",
        );
        throw "";
      });
      await BO.open({mode:"EUC",EUC:euc});
    }catch (e) {
      self.event.emit("error",e);
    }finally {
      await BO.close();
    }
  });
}