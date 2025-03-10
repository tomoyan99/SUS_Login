import {description} from "../../description/description";
import {UIManager} from "../../ui/UIManager";

export function appInfo(self: UIManager) {
    self.setInfo(description.SUS_LOGIN);
}