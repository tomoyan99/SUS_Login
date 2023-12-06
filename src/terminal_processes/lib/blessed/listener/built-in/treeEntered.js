export function treeEntered(self,t) {
    const c = self.components;
    const root = t.rows;
    const node = t.nodeLines[root.getItemIndex(root.selected)];
    //選択した要素からエスケープを取り除き、選択時の色を付けて表示
    const reg = /{.+?}(.+?){\/}/g;
    let content = node.name.replace(reg,"$1");
    let colored_content = `>>{${self.colors.choice.fg}-fg}{${self.colors.choice.bg}-bg}${content}{/}{/}`;
    self.setChoice(colored_content);
    self.changeInfoLabel(content);
    //イベントをエミット
    try {
        self.setFocus(c.info);
        self.event.emit(node.event,self,node);
    }catch (e){
        self.event.emit("error",e);
    }finally {
        c.screen.render();
    }
}