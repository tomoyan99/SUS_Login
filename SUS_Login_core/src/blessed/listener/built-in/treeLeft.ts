export function treeLeft(self, t) {
    const root = t.rows;
    const node = t.nodeLines[root.getItemIndex(root.selected)];
    //左を押したとき、子要素がある(開閉可能)ならextended属性をfalseにしてデータの再設置
    //(データを再設置したとき、contrib.treeの効果で閉じて表示される)
    if (node.children) {
        node.extended = false;
        t.setData(t.data);
        self.components.screen.render();
    }
}