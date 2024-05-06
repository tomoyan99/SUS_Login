import {isAsyncFunction} from "util/types";

async function errorLoop<T>(
    max_loop: number,
    func:Function
): Promise<T> {
    for (let i = 0; i < max_loop; i++) {
    try {
        return <T>await func();
    } catch (e) {
        console.log()
        // console.log(e)
    }
}
throw new Error("[Error] retried 4th but couldn't resolve");
}

errorLoop(4,()=>{
    throw "aiueo"
})