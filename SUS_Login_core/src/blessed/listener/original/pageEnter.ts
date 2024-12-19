import MainHome from "../../home/MainHome";

export function pageEnter(self:MainHome) {
  const c = self.components;
  self.setFocus(c.subTree);
  c.subTree.setData(self.data.sub);
  c.subTree.rows.select(0);
}