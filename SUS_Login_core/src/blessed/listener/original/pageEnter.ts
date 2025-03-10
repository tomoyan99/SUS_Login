import {UIManager} from "../../ui/UIManager";

export function pageEnter(self: UIManager) {
    const c = self.components;
    self.setFocus(c.subTree);
    // c.subTree?.setData(self.data.sub);
    c.subTree?.rows.select(0);
}