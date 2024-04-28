export function screenEsc(self) {
    const f_now_name = self.status.focus.now.name;
    if (f_now_name && f_now_name === "info"){
        self.setFocus(self.status.focus.bef);
    }
}