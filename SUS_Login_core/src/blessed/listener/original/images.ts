import {execSync} from "child_process";
import MainHome from "../../home/MainHome";

export function images(self:MainHome) {
  self.setInfo("[EUC_IMAGESを開きます]");
  try {
    execSync("start data\\images", {});
  } catch (e) {
    throw "{red-bg}data/imagesが見つかりませんでした{/}";
  }
}