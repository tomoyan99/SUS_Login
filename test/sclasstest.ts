import {browserOpener} from "../src/terminal_processes/lib/puppeteer/BrowserOpener";
import BrowserOpener = browserOpener.BrowserOpener;

const param :browserOpener.Param={
    userdata:{ID:"T122063",password:"pZ2Gqb9!"},
    mode:"SCLASS"
}
const BO = new BrowserOpener(param);
BO.open();
