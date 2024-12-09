import MainHome from "../../home/MainHome";

export function screenTab(self:MainHome) {
  if (self.status.focus.now?.name !== "info") {
    self.setFocus(self.components.info);
  } else if (self.status.focus.bef){
    self.setFocus(self.status.focus.bef);
  }
}