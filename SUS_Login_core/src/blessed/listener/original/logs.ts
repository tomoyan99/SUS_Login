import {execSync} from "child_process";
import {UIManager} from "../../ui/UIManager";

export function logs(self: UIManager) {
    self.setInfo("[EUC_LOGを開きます]");
    execSync(`start ${process.env.logFilePath}`);
}