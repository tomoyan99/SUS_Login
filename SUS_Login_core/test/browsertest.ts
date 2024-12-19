import Opener from "../src/puppeteer/BrowserOpener";
import {User} from "../src/main/setup";
import {sleep} from "../src/utils/myUtils";

async function test() {
  const param1 :User = {
      username: "T122063",
      password: "pZ2Gqb9!",
  }
  let BO = new Opener.BrowserOpener(param1);
  BO = await BO.launch({is_headless:false});
  BO.onClose(()=>{
      console.log("closed");
  })
  await BO.open({mode:"SOLA",solaLink_URL:"https://sola.sus.ac.jp/course/view.php?id=6612"});
  return;
}

async function test2(){
    for (let i = 0; i < 1; i++) {
        await test();
    }
}
test2()