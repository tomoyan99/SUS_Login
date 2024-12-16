import {execSync} from "child_process";
import MainHome from "../../home/MainHome";
import path from "path";

export function logs(self:MainHome) {
  self.setInfo("[EUC_LOGを開きます]");
  execSync(`start ${path.join(<string>process.env.userDataPath,"data/logs/euc.log")}`);
}