import Index from "enquirer";
import {pause} from "./pause";
import {control as cl} from "./control";
import {sleep} from "./myUtils";

export namespace MyPrompt {
  export type Prompt<T extends "input" | "password" | "confirm"> = {
    message: string;
    type: T;
  };
  export type Answer<T extends string | boolean> = {
    result: T;
  };

  export async function question(
    prompt: MyPrompt.Prompt<"input" | "password">,
  ): Promise<MyPrompt.Answer<string>>;
  export async function question(
    prompt: MyPrompt.Prompt<"confirm">,
  ): Promise<MyPrompt.Answer<boolean>>;
  export async function question(
    prompt: MyPrompt.Prompt<"input" | "password" | "confirm">,
  ): Promise<Answer<string | boolean>> {
    switch (prompt.type) {
      case "input":
      case "password": {
        let answerCheckList = [];
        const answer: MyPrompt.Answer<string> = { result: "" };
        let result: { response: string };
        do {
          result = await Index.prompt({
            message: prompt.message,
            name: "response",
            type: prompt.type,
            async onCancel() {
              await pause("exit");
              return true;
            },
          });
          //何も入力されていなければcontinue
          if (result.response === "") {
            console.log(`${cl.error}[INPUT ERROR] 何も入力されていません${cl.reset}`);
            await sleep(1000);
            continue;
          }
          //answerCheckListに入力内容をpush
          answerCheckList.push(result.response);
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
              console.log(
                `${cl.error}[INPUT ERROR] 入力が一致しません${cl.reset}`,
              );
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
        answer.result = result.response;
        return answer;
      }
      case "confirm": {
        const answer: MyPrompt.Answer<boolean> = { result: false };
        const result: { response: boolean } = await Index.prompt({
          message: prompt.message,
          name: "response",
          type: "toggle",
          enabled: "NO",
          disabled: "YES",
          // @ts-ignore
          separator: `${cl.reset}>>`,
          onSubmit(value) {
            return value === "YES";
          },
          async onCancel() {
            await pause("exit");
            return true;
          },
        });
        answer.result = !result.response;
        return answer;
      }
    }
  }
}

