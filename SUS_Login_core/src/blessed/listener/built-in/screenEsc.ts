import {UIManager} from "../../ui/UIManager";

export function screenEsc(self: UIManager) {
    const f_now_name = self.state.focus.now?.name;
    if (f_now_name && f_now_name === "info" && self.state.focus.bef) {
        self.setFocus(self.state.focus.bef);
    }
}