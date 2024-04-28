import {execSync} from "child_process";

export function logs(self) {
    self.setInfo("[EUC_LOGを開きます]");
    execSync("start data/logs/euc.log");
}