import {isNetConnected} from "../../../utils/isNetConnected";
import {UIManager} from "../../ui/UIManager";

export async function network(self: UIManager) {
    const network = self.network;
    const condition = await isNetConnected();
    self.changeNetStatus(condition);
    network.id = setInterval(async () => {
        const ns = await isNetConnected();
        if (network.status && network.status !== condition) {
            self.changeNetStatus(ns);
        }
    }, 500);
}