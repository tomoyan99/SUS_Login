import {sleep} from "../src/utils/myUtils";

async function error(){
    await sleep(1200);
    throw "example"
}

async function main() {
    let id ;
    try {
        id = setInterval(()=>console.log("yes"),250);
        await error();
    }catch(e) {
        console.log("error");
    }finally {
        console.log("finally");
        clearInterval(id);
    }
}
main()