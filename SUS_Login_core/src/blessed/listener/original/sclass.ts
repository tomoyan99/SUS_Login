import MainHome from "../../home/MainHome";
import Opener from "../../../puppeteer/BrowserOpener";

export async function sclass(self:MainHome) {
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
    await BO.open({mode:"SCLASS"});
  }catch (e) {
    self.event.emit("error",e);
  }finally {
    await BO.close();
  }
}