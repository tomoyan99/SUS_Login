import {execSync} from "child_process";
import MainHome from "../../home/MainHome";
import path from "path";

export function images(self:MainHome) {
  self.setInfo("[EUC_IMAGESを開きます]");
  try {
    execSync(`start ${process.env.imagesDirPath}`);
  } catch (e) {
    throw "{red-bg}data/imagesが見つかりませんでした{/}";
  }
}