export function treeSelect(self,t) {
    const root = t.rows;
    const node = t.nodeLines[root.getItemIndex(root.selected)];
    const desc = self._data.description;
    if (node){
        const reg = /{.+?}(.+?){\/}/g;
        const name_noESC = node.name.replace(reg,"$1");
        const content = `>>{blink}${name_noESC}{/}`
        //選択したものを点滅させながら選択表示部に表示
        self.setChoice(content);
        if (desc[name_noESC]){
            self.changeInfoLabel();
            self.setInfo(desc[name_noESC]);
        }
        const fn = self.status.focus.now;
        if (fn.name === "subTree" && !desc[name_noESC]){
            self.changeInfoLabel();
            self.setInfo(`『{#006be6-bg}${name_noESC}{/}』のページを開きます`);
        }
    }else{
    }
}