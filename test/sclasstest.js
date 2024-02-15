// import {openContext, openSclass, resizeWindow} from "../src/terminal_processes/lib/puppeteer/Openers.js";
//
// const context = await openContext("SCLASS");
// const page = await openSclass(context,{ username: "T122063", password:"pZ2Gqb9!"} ,false);
// await resizeWindow(page,[1200,700]);

import {openContext, openSclass, resizeWindow} from "../src/terminal_processes/lib/puppeteer/Openers.js";
import {isObjEmpty} from "../src/terminal_processes/lib/utils/myUtils.js";
import {control as cl} from "../src/terminal_processes/lib/utils/control.js";

const self = {
    data :{
        user:{ username: "T122063", password:"pZ2Gqb9!"}
    },
    appendInfo:console.log,
}
async function sclass(self,node) {
    // self.setInfo("");
    let miss_count = 0;
    let context;
    try{
        context = await openContext("SCLASS");
    }catch (e) {
        // self.event.emit("error","[BROWSER ERROR]\nブラウザを開くのに失敗しました。\n再度やり直すことで回復する可能性があります");
        console.log(e);
        return;
    }
    do {
        try {
            //ページが開かれているならsclassを開く
            if (!isObjEmpty(await context.pages())){
                const page = await openSclass(context,self.data.user,false)
                await resizeWindow(page,[1200,700]);
            }
            break;
        }catch (e) {
            //ブラウザウィンドウが途中で閉じられた場合
            if (isObjEmpty(await context.pages())){
                console.log("ブラウザとじ");
                await context.close();
                break;
            }else{
                //ミスした場合は0~3の全4回実行
                if (miss_count < 3){
                    miss_count++;
                    console.log(e);
                }else{
                    //4回やってもだめだったらエラー
                    console.log("4回エラー")
                    await context.close();
                    break;
                }
            }
        }
    }while (true);
}

await sclass(self);