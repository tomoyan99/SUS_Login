import ora from 'ora';
import spinners from 'cli-spinners';

const spinner = ora({
    text: 'Loading...',
    spinner: spinners.dots,
});

let a = setInterval(() => {
    const str = spinner.frame();
    console.log(str);
    process.stdout.write(`\x1b[1A`);
    for (let i = 0; i < str.length; i++) {
        process.stdout.write(`\b`);
    }
},80);
setTimeout(() => {
    clearInterval(a);
    spinner.succeed("done").frame();
}, 3000);


