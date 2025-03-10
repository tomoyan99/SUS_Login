import {UIManager} from "../../ui/UIManager";

export function screenTab(self: UIManager) {
    if (self.state.isChangeFocus) {
        if (self.state.focus.now?.name !== "info") {
            self.setFocus(self.components.info);
        } else if (self.state.focus.bef) {
            self.setFocus(self.state.focus.bef);
        }
    }
}