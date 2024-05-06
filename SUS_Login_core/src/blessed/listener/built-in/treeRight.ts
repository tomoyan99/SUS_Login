export function treeRight(self, t) {
  const root = t.rows;
  const node = t.nodeLines[root.getItemIndex(root.selected)];
  //右を押したとき、子要素がある(開閉可能)ならextended属性をtrueにしてデータの再設置
  //(データを再設置したとき、contrib.treeの効果で開いて表示される)
  if (node.children) {
    node.extended = true;
    t.setData(t.data);
    self.components.screen.render();
  }
}