import Opener from "../../../puppeteer/BrowserOpener";
import MainHome from "../../home/MainHome";

export async function sola(self:MainHome, node:{url:string}) {
  self.clearInfo();
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
      self.appendInfo("{yellow-fg}[SOLA] ブラウザが閉じられました{/}");
    });
    await BO.open({mode:"SOLA",solaLink_URL:node.url});
  }catch (e) {
    self.event.emit("error",e);
  }
}