import {UIManager} from "../../ui/UIManager";

export function pageReturn(self: UIManager) {
    const c = self.components;
    self.setFocus(c.mainTree);
    // c.subTree?.setData({});
}