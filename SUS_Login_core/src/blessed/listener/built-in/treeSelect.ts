import MainHome, {TreeNode} from "../../home/MainHome";
import contrib from "blessed-contrib";
import {Widgets} from "blessed";

export function treeSelect(self:MainHome, t:contrib.widget.Tree) {
  const root = t.rows;
  const node = <TreeNode><unknown>t.nodeLines![root.getItemIndex((<Widgets.ListElementStyle><unknown>root).selected)];
  const desc = self.data.description;

  if (node && node.name) {
    const reg = /{.+?}(.+?){\/}/g;
    const name_noESC = node.name.replace(reg, "$1");
    const content = `>>{blink}${name_noESC}{/}`;
    //選択したものを点滅させながら選択表示部に表示
    self.setChoice(content);
    if (desc[name_noESC]) {
      self.changeInfoLabel();
      self.setInfo(desc[name_noESC]);
    }
    const fn = self.status.focus.now;
    if (fn && fn.name === "subTree" && !desc[name_noESC]) {
      self.changeInfoLabel();
      self.setInfo(`『{#006be6-bg}${name_noESC}{/}』のページを開きます`);
    }
  }
}