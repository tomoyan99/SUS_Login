import {makeSchedule} from "../src/terminal_processes/main/makeSchedule.js";
const data = {
    user:{
        username:"T122063",
        password:"pZ2Gqb9!"
    }
};

const a = await makeSchedule(data,console.log);

console.log(a)