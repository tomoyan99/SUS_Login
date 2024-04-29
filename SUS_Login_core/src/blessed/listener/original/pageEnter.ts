export function pageEnter(self, t) {
    const c = self.components;
    self.setFocus(c.subTree);
    c.subTree.setData(self._data.sub);
    c.subTree.rows.select(0);
}