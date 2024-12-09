import MainHome from "../../home/MainHome";

export function pageReturn(self:MainHome) {
  const c = self.components;
  self.setFocus(c.mainTree);
  c.subTree.setData({});
}