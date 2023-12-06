export function pageReturn(self,t) {
    const c = self.components;
    self.setFocus(c.mainTree);
    c.subTree.setData({});
}