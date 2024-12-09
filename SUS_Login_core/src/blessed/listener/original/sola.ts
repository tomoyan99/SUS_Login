import Opener from "../../../puppeteer/BrowserOpener";
import MainHome from "../../home/MainHome";

export async function sola(self:MainHome, node:{url:string}) {
  self.clearInfo();
  let BO = new Opener.BrowserOpener(self.data.user);
  try {
    BO = await BO.launch({is_headless:true,printFunc:self.appendInfo,clearFunc:self.clearInfo}).catch(()=>{
      self.event.emit(
          "error",
          "[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります",
      );
      throw "";
    });
    await BO.open({mode:"SOLA",solaLink_URL:node.url});
  }catch (e) {
    self.event.emit("error",e);
  }finally {
    await BO.close();
  }
}