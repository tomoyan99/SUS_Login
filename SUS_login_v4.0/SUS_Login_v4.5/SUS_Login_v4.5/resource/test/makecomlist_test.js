//選択肢をフィルタリングしてコマンドリストを作成
import {control as cl} from "../util/control.js";

async function makeComList(Options){
    return Options.map((NE1)=>{
        return NE1.map((NE2)=>{
            return NE2.replace(/(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]/g,"").replace(/^(>>|\d\.)/,"").toLowerCase();
        });
    });
}

const comList = await makeComList([["1.euc", ">>logs", ">>images"], ["2.sola", ">>List"], ["3.sclass"], ["4.sclassとsola"], [`${cl.fg_red}5.QUIT${cl.fg_reset}`]]);
console.log(comList);