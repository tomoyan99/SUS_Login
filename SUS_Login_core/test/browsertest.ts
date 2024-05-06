import Opener from "../src/puppeteer/BrowserOpener";
import * as puppeteer from "puppeteer-core";
async function test() {
  const param1 :Opener.User = {
      username: "T122063",
      password: "pZ2Gqb9!",
  }
  let BO = new Opener.BrowserOpener(param1);
  BO = await BO.launch({is_headless:true});
  BO = await BO.open({ mode: "SCLASS"});
  await BO.close();
    console.log("[SCLASS アクセス完了]")
  return;
}

test()