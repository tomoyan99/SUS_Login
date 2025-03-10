import {execSync} from "child_process";
import {UIManager} from "../../ui/UIManager";

export function images(self: UIManager) {
    self.setInfo("[EUC_IMAGESを開きます]");
    try {
        execSync(`start ${process.env.imagesDirPath}`);
    } catch (e) {
        throw "{red-bg}data/imagesが見つかりませんでした{/}";
    }
}