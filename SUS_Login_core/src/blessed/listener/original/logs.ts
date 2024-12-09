import {execSync} from "child_process";
import MainHome from "../../home/MainHome";

export function logs(self:MainHome) {
  self.setInfo("[EUC_LOGを開きます]");
  execSync("start data/logs/euc.log");
}