import MainHome, {TreeNode} from "../../home/MainHome";
import contrib from "blessed-contrib";
import {Widgets} from "blessed";

export function treeRight(self:MainHome, tree:contrib.widget.Tree) {
  const root:Widgets.ListElement = tree.rows;
  const node = <TreeNode><unknown>tree.nodeLines![root.getItemIndex((<Widgets.ListElementStyle><unknown>root).selected)];
  //右を押したとき、子要素がある(開閉可能)ならextended属性をtrueにしてデータの再設置
  //(データを再設置したとき、contrib.treeの効果で開いて表示される)
  if (node && node.children) {
    node.extended = true;
    tree.setData(tree.data);
    self.components.screen.render();
  }
}