import solaLinkReload from "../../../puppeteer/solaLinkReload.js";
import MainHome from "../../home/MainHome";

export function pageReload(self:MainHome) {
  const c = self.components;
  const lb = self.listeners.blessed;
  self.appendInfo("[科目ページリストを更新してよろしいですか？(y/n)]");
  c.form.once("submit", async () => {
    const value = self.status.inputValue;
    self.setFocus(c.info);
    if (value === "y") {
      try {
        self.appendInfo("科目ページリストを更新します");
        c.info.unkey("enter", () => {
          lb.screenTab(self);
        });
        const newData = await solaLinkReload(self.data.user, self.appendInfo);
        newData.solaLink["{yellow-fg}戻る{/}"] = { event: "return" };
        self.data.sub = self.treeingEventMap(newData.solaLink);
      } catch (e:unknown) {
        if (e instanceof Error) {
          self.event.emit(
              "error",
              "[ERROR] 科目ページリストの更新に失敗しました\n" + e.stack,
          );
        }else{
          self.event.emit(
              "error",
              "[ERROR] 科目ページリストの更新に失敗しました\n" + e,
          );
        }
      } finally {
        c.info.key("enter", () => {
          lb.screenTab(self);
        });
        c.form.removeAllListeners("cancel");
      }
    } else {
      self.appendInfo("科目ページリストの更新を中止します");
      c.form.removeAllListeners("cancel");
    }
    self.status.inputValue = "";
  });
  c.form.once("cancel", () => {
    c.form.removeAllListeners("submit");
    c.form.removeAllListeners("cancel");
  });
  self.setFocus(c.form);
}