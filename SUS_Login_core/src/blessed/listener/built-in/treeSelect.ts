import {TreeNode} from "../../ui/UITypes";
import contrib from "blessed-contrib";
import {Widgets} from "blessed";
import {UIManager} from "../../ui/UIManager";

export function treeSelect(self: UIManager, t: contrib.widget.Tree) {
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
        const fn = self.state.focus.now;
        if (fn) {
            // PAGE_LISTに選択フォーカスが来たときだけsubTreeにデータを追加。
            if (name_noESC === "PAGE_LIST") {
                self.components.subTree?.setData(self.data.sub);
            }else{
                // 選択フォーカスがPAGE_LISTではないときはsubTree非表示
                // ただし、subTree内で消えられるのは困るので防ぐ
                if (self.components.subTree?.data && fn.name === "mainTree"){
                    self.components.subTree?.setData({});
                }
            }

            // subTreeでのinfoに表示する文章
            if (fn.name === "subTree" && !desc[name_noESC]) {
                self.changeInfoLabel();
                self.setInfo(`『{#006be6-bg}${name_noESC}{/}』のページを開きます`);
            }
        }
    }
}