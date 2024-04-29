import Index from "enquirer";
import {pause} from "../src/utils/pause";
import {control as cl} from "../src/utils/control";
import {sleep} from "../src/utils/myUtils";
import {myConfirm} from "../src/utils/MyPrompt";


type Prompts = {
    [key:string]:{
        message:string,
        name:string,
        type:"input"|"password"|"confirm"
    }
}
type Answer = {
    [key:string]:string
};

export class MyPrompt {
    static async Question(prompts:Prompts){
        let answers:Answer={};
        for (const promptsKey in prompts) {
            const prompt = prompts[promptsKey];
            let answerCheckList = [];
            let answer: Answer={};
            switch (prompt.type) {
                case "input":
                case "password":
                    do {
                        answer = await Index.prompt({
                            message: prompt.message,
                            name: prompt.name,
                            type: prompt.type,
                            async onCancel() {
                                await pause("exit");
                                return true;
                            }
                        });
                        //何も入力されていなければcontinue
                        if (answer[prompt.name] === "") {
                            console.log(`${cl.error}[INPUT ERROR] 何も入力されていません${cl.reset}`);
                            await sleep(1000);
                            continue;
                        }
                        //answerCheckListに入力内容をpush
                        answerCheckList.push(answer[prompt.name]);
                        //typeがpasswordじゃなければ確認無しでbreak;
                        if (prompt.type !== "password") {
                            break;
                        }
                        //typeがpasswordなら二度の入力の後、正誤チェック
                        if (answerCheckList.length === 2) {
                            if (answerCheckList[0] === answerCheckList[1]) {
                                //入力が一致したらbreak
                                break;
                            } else {
                                //入力が一致しなかったらanswerCheckListを初期化してcontinue
                                console.log(`${cl.error}[INPUT ERROR] 入力が一致しません${cl.reset}`);
                                await sleep(500);
                                answerCheckList.length = 0;
                            }
                        } else {
                            //入力がまだ一度目のとき、ループ続行
                            console.log("確認のためもう一度入力してください");
                            await sleep(500);
                        }
                    } while (true);
                    //入力内容をanswersに入れる
                    answers[promptsKey] = answer[prompt.name];
                    break;
                case "confirm":
                    answer = await Index.prompt({
                        message:prompt.message,
                        name:prompt.name,
                        type:prompt.type,
                        format(value) {
                            // let { styles, state } = this;
                            const defaultValue = "YES or NO"
                            // value = this.isTrue(value) ? 'YES' : 'NO';
                            return "";
                            // return !state.submitted ? styles.primary(defaultValue) : styles.success(value);
                        },
                        onSubmit(name, value, prompt) {
                            return value === "YES";
                        },
                        async onCancel(name, value, prompt) {
                            await pause("exit");
                            return true;
                        }
                    });
                    answers[promptsKey]=answer[prompt.name];
                    break;
            }
            return answers;
        }
    }
}

const pr:Prompts = {
    "YN":{message: "再試行しますか？",name: "retry",type:"confirm"}
};
(async ()=>{
    const mp = await MyPrompt.Question(pr);
    console.log(mp)
})()
