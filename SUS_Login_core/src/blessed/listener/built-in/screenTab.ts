export function screenTab(self) {
    if (self.status.focus.now.name !== "info"){
        self.setFocus(self.components.info);
    }else{
        self.setFocus(self.status.focus.bef);
    }
}