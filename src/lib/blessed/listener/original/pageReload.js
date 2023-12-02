import solaLinkReload from "../../../utils/solaLinkReload.js";
import {sleep} from "../../../utils/myUtils.js";

export function pageReload(self){
    const c = self.components;
    const lb = self.listeners.blessed;
    self.appendInfo("[科目ページリストを更新してよろしいですか？(y/n)]");
    c.form.once("submit",async()=>{
        const value = self.status.inputValue;
        self.setFocus(c.info);
        if (value === "y"){
            try {
                self.appendInfo("科目ページリストを更新します");
                c.info.unkey("enter",()=>{lb.screenTab(self)});
                const newData = await solaLinkReload(self._data,self.appendInfo);
                newData.soraLink["{yellow-fg}戻る{/}"] = { event: "return" };
                self._data.sub  = self._parseListData(newData.soraLink);
            }catch (e){
                 self.event.emit("error","[ERROR] 科目ページリストの更新に失敗しました");
            }finally{
                c.info.key("enter",()=>{lb.screenTab(self)});
                c.form.removeAllListeners("cancel");
            }
        }else{
            self.appendInfo("科目ページリストの更新を中止します");
            c.form.removeAllListeners("cancel");
        }
        self.status.inputValue = "";
    });
    c.form.once("cancel",()=>{
        c.form.removeAllListeners("submit");
        c.form.removeAllListeners("cancel");
    });
    self.setFocus(c.form);
}