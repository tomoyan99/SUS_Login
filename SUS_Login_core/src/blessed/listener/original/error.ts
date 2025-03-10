import {UIManager} from "../../ui/UIManager";

export function error(self: UIManager, error: Error | string) {
    let message: string = "";
    if (typeof error === "object") {
        message = error.stack?.toString() ?? error.message;
    } else {
        message = error;
    }
    self.changeInfoLabel("ERROR");
    self.setInfo(message);
}