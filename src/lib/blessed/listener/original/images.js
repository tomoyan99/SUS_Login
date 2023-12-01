import {execSync} from "child_process";

export function images(self) {
    self.setInfo("[EUC_IMAGESを開きます]");
    try {
        execSync("start data\\images",{
        });
    }catch (e) {
        throw "{red-bg}data/imagesが見つかりませんでした{/}";
    }
}