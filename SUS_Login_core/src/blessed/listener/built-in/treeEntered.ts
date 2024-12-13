import MainHome, {TreeNode} from "../../home/MainHome";
import contrib from "blessed-contrib";
import {Widgets} from "blessed";

export function treeEntered(self:MainHome, tree:contrib.widget.Tree) {
  const c = self.components;
  const root:Widgets.ListElement = tree.rows;
  const node = <TreeNode><unknown>(tree.nodeLines![root.getItemIndex((<Widgets.ListElementStyle><unknown>root).selected)]);

  if (node.name && node.event){
    //選択した要素からエスケープを取り除き、選択時の色を付けて表示
    const reg = /{.+?}(.+?){\/}/g;
    let content = node.name.replace(reg, "$1");
    let colored_content = `>>{${self.colors.choice.fg}-fg}{${self.colors.choice.bg}-bg}${content}{/}{/}`;
    //イベントをエミット
    const excludeNameList = ["前期", "後期"];
    try {
      if (excludeNameList.includes(node.name)) return; //除外リストに入っているnode.nameは無効
      self.setChoice(colored_content);
      self.changeInfoLabel(content);
      self.setFocus(c.info);
      self.event.emit(node.event, self, node);
    } catch (e) {
      self.event.emit("error", e);
    } finally {
      c.screen.render();
    }
  }
}