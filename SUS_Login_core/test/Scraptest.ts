import {createSolaLinkData} from "../src/puppeteer/createSolaLinkData";
import {writeJSON} from "../src/utils/myUtils";

async function test(){
    const data = await createSolaLinkData({
        username:"T122063",
        password:"pZ2Gqb9!",
        is_app:false,
        is_headless:true,
        is_secret:false
    });
    writeJSON("./data/data.json",data,true);
}
test()