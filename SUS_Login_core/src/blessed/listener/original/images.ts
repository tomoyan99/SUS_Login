import {execSync} from "child_process";
import MainHome from "../../home/MainHome";
import path from "path";

export function images(self:MainHome) {
  self.setInfo("[EUC_IMAGESを開きます]");
  try {
    execSync(`start ${path.join(<string>process.env.userDataPath,"data/images")}`, {});
  } catch (e) {
    throw "{red-bg}data/imagesが見つかりませんでした{/}";
  }
}