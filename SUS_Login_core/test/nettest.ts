import {NetWorkStatus} from "../src/utils/NetWorkChecker"
import {sleep} from "../src/utils/myUtils";

async function test(){
    const ne = new NetWorkStatus();
    await ne.on();
    ne.addEvent("change",{id:"alert",listener:()=>{
            console.log("changed!")
    }});
    for (let i = 0; i < 20; i++) {
        console.log(ne.getIsConnected());
        await sleep(1000);
    }
    await ne.off();
}
test();