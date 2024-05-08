import Opener from "../src/puppeteer/BrowserOpener";
import * as puppeteer from "puppeteer-core";
import {User} from "../src/main/setup";
import {sleep} from "../src/utils/myUtils";
async function test() {
  const param1 :User = {
      username: "T122063",
      password: "pZ2Gqb9!",
  }
  let BO = new Opener.BrowserOpener(param1);
  BO = await BO.launch({is_headless:false});
  await BO.open({mode:"SOLA"});
  await sleep(1000);
  await BO.close();
  return;
}

async function test2(){
    for (let i = 0; i < 4; i++) {
        await test();
        await sleep(4000);
    }
}
test2()