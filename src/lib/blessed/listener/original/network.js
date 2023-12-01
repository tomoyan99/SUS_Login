import {isNetConnected} from "../../../utils/isNetConnected.js";

export async function network(self) {
    const n = self.network;
    const ns = await isNetConnected();
    self.changeNetStatus(ns);
    n.id = setInterval(async()=>{
        const ns = await isNetConnected();
        if (n.status !== ns){
            self.changeNetStatus(ns);
        }
    },500);
}