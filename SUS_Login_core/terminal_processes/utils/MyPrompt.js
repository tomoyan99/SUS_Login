import Index from "enquirer";
import {pause} from "./pause.js";
import {control as cl} from "./control.js";
import {sleep} from "./myUtils.js";

export class MyPrompt {
    static async Question(prompts = {
        key:{message:"question?",name:"answer",type:"input"}
    }){
        const answers = {};
        for (const promptsKey in prompts) {
            const prompt = prompts[promptsKey];
            let answerCheckList = [];
            // console.log(promptsKey,":",prompt);
            let answer = "";
            do {
                answer = await Index.prompt({
                    message:prompt.message,
                    name:prompt.name,
                    type:(prompt.type === "password")?"password":"input",
                    async onCancel(name, value, prompt) {
                        await pause("exit")
                    }
                })
                //何も入力されていなければcontinue
                if (answer[prompt.name] === ""){
                    console.log(`${cl.error}[INPUT ERROR] 何も入力されていません${cl.reset}`);
                    await sleep(1000);
                    continue;
                }

                //answerCheckListに入力内容をpush
                answerCheckList.push(answer[prompt.name]);

                //typeがpasswordじゃなければ確認無しでbreak;
                if (prompt.type !== "password"){
                    break;
                }
                //typeがpasswordなら二度の入力の後、正誤チェック
                if (answerCheckList.length === 2){

                    if (answerCheckList[0] === answerCheckList[1]){
                        //入力が一致したらbreak
                        break;
                    }else{
                        //入力が一致しなかったらanswerCheckListを初期化してcontinue
                        console.log(`${cl.error}[INPUT ERROR] 入力が一致しません${cl.reset}`);
                        await sleep(500);
                        answerCheckList.length = 0;
                    }
                }else{
                    //入力がまだ一度目のとき、ループ続行
                    console.log("確認のためもう一度入力してください");
                    await sleep(500);
                }
            }while (true);
            //入力内容をanswersに入れる
            answers[promptsKey] = answer[prompt.name];
        }
        return answers;
    }
}

export async function myConfirm(arg  ={message:"" ,name:""}){
    const answer = await Index.prompt({
        message:arg.message,
        name:arg.name,
        type:"confirm",
        hint:`${cl.reset}${cl.fg_yellow}[Y]-Yes [N/Enter]-No${cl.reset}`,
        separator:`${cl.reset}>>`,
        format(value) {
            let { styles, state } = this;
            const defaultValue = "YES or NO"
            value = this.isTrue(value) ? 'YES' : 'NO';
            return !state.submitted ? styles.primary(defaultValue) : styles.success(value);
        },
        onSubmit(name, value, prompt) {
            return value === "YES";
        },
        async onCancel(name, value, prompt) {
            await pause("exit");
        }
    });
    return answer[arg.name];
}