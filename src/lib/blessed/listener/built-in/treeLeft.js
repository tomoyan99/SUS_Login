export function treeLeft(self,t) {
    const root = t.rows;
    const node = t.nodeLines[root.getItemIndex(root.selected)];
    //この処理なに？？？？？(消すとリスト開閉がバグる)
    if (node.children) {
        node.extended = false;
        t.setData(t.data);
        t.render();
    }
}