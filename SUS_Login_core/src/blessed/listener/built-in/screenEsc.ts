import MainHome from "../../home/MainHome";

export function screenEsc(self:MainHome) {
  const f_now_name = self.status.focus.now?.name;
  if (f_now_name && f_now_name === "info" && self.status.focus.bef) {
    self.setFocus(self.status.focus.bef);
  }
}