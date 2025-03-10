import {UIManager} from "../../ui/UIManager";
import {control as cl} from "../../../utils/control";
import {createSolaLinkData} from "../../../puppeteer/createSolaLinkData";
import {writeFileSync} from "fs";
import MyCrypt from "../../../utils/MyCrypt";
import {sleep} from "../../../utils/myUtils";
import {MainData} from "../../../main/setup";
import {DataFormatter} from "../../ui/DataFormatter";

export function pageReload(self: UIManager) {
    const c = self.components;
    const lb = self.eventService.listeners.blessed;
    self.appendInfo("[科目ページリストを更新してよろしいですか？(y/n)]");
    c.form?.once("submit", async () => {
        const value = self.state.inputValue;
        self.setFocus(c.info);
        if (value === "y") {
            self.state.isChangeFocus = false;
            try {
                self.appendInfo("科目ページリストを更新します");
                self.clearInfo();
                const newData = await solaLinkReload(self);
                const formattedData = DataFormatter.format(newData.userdata, newData.solaLink);
                self.data.sub = formattedData.sub;
            } catch (e: unknown) {
                if (e instanceof Error) {
                    self.eventService.emit(
                        "error",
                        "[ERROR] 科目ページリストの更新に失敗しました\n" + e.stack,
                    );
                } else {
                    self.eventService.emit(
                        "error",
                        "[ERROR] 科目ページリストの更新に失敗しました\n" + e,
                    );
                }
            } finally {
                self.state.isChangeFocus = true;
                c.form?.removeAllListeners("cancel");
            }
        } else {
            self.appendInfo("科目ページリストの更新を中止します");
            c.form?.removeAllListeners("cancel");
        }
        self.state.inputValue = "";
    });
    c.form?.once("cancel", () => {
        c.form?.removeAllListeners("submit");
        c.form?.removeAllListeners("cancel");
    });
    self.setFocus(c.form);
}


async function solaLinkReload(self: UIManager) {
    const info_path = process.env.infoPath;
    if (!info_path) {
        throw "data_file path is undefined";
    }
    const userData = self.data.user;
    const mc = new MyCrypt(info_path);
    let new_data: Partial<MainData> = {};
    if (userData) {
        new_data.userdata = {
            username: userData.username,
            password: userData.password,
        };
    } else {
        throw "userData is undefined";
    }
    //info.jsonの存在をチェック
    self.appendInfo(`${cl.fg_yellow}※ 回線の都合上時間がかかる場合があります${cl.fg_reset}`);
    try {
        /* createSolaLinkData関数：solaLinkDataの取得 */
        new_data.solaLink = await createSolaLinkData(userData, {printFunc: self.appendInfo.bind(self)});
        new_data = <MainData>new_data;
        self.appendInfo("認証ファイルの暗号化を行います・・・");
        // info.jsonの作成or初期化
        writeFileSync(info_path, "");
        await mc.writeCrypt(new_data); //info.jsonを暗号化して書き込み
        await sleep(2000);
        self.appendInfo("設定が完了しました。");
        return <MainData>new_data;
    } catch (e) {
        throw e;
    }
}
