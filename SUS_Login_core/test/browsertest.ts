import Opener from "../src/puppeteer/BrowserOpener";
import {User} from "../src/main/setup";
import {sleep} from "../src/utils/myUtils";

async function test() {
  const param1 :User = {
      username: "T122063",
      password: "pZ2Gqb9!",
  }
  let BO = new Opener.BrowserOpener(param1);
  BO = await BO.launch({is_headless:true});
  for (let i = 0; i < 10; i++) {
    await BO.open({mode:"EUC",EUC:"123"});
  }
  await BO.close();
  await sleep(1000);
  // await BO.close();
  return;
}

async function test2(){
    for (let i = 0; i < 1; i++) {
        await test();
    }
}
test2()