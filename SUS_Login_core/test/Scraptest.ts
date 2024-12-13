import {createSolaLinkData} from "../src/puppeteer/createSolaLinkData";
import {writeJSON} from "../src/utils/myUtils";

async function test(){
    const data = await createSolaLinkData({username:"T122063", password:"pZ2Gqb9!"});
    // const data = {x:1};
    writeJSON("./data/data.json",data,true);
}
test()