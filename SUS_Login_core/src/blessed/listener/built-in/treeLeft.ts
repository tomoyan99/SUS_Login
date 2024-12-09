import MainHome, {TreeNode} from "../../home/MainHome";
import contrib from "blessed-contrib";
import {Widgets} from "blessed";

export function treeLeft(self:MainHome, tree:contrib.widget.Tree) {
  const root:Widgets.ListElement = tree.rows;
  const node = <TreeNode><unknown>tree.nodeLines![root.getItemIndex((<Widgets.ListElementStyle><unknown>root).selected)];
  //左を押したとき、子要素がある(開閉可能)ならextended属性をfalseにしてデータの再設置
  //(データを再設置したとき、contrib.treeの効果で閉じて表示される)
  if (node && node.children) {
    node.extended = false;
    tree.setData(tree.data);
    self.components.screen.render();
  }
}