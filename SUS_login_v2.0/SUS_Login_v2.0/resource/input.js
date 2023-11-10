
process.stdin.setEncoding('utf8');
const CtrlC = "\u0003";
const erathe = "\b\b\x1b[0K";
const nowrite = "\b\x1b[0K";
const readline = require('readline');

const inputKey = (prompt) => new Promise(resolve => {
	const stdin = process.stdin;
	const isRow = stdin.isRaw;
	const callBack = key => {
		process.stdout.write("*");
		stdin.off("data", callBack);
		stdin.pause();
		stdin.setRawMode(isRow);
		resolve(key);//resolve
	};
	stdin.setRawMode(true);
	stdin.resume();
	stdin.on("data", callBack);
});


// 標準入力の受け取り
module.exports = async function input(prompt,ishide = false) {
	if (ishide === false) {
		const readInterface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		return new Promise((resolve) => {
			readInterface.question(prompt, (input) => {
				readInterface.close();
				resolve(input);
			});	
		});		
	} else if (ishide === true) {
		let key = "";
		process.stdout.write(prompt);
		let str = "";
		for (; key.charCodeAt(0) !== 13;) {
			key = await inputKey();
			if (key === CtrlC) process.exit(-1);
			if (key === "\b") {
				if (str !== "") {
					process.stdout.write(erathe);
					str = str.slice(0, str.length - 1);
				} else {
					process.stdout.write(nowrite);
				}
				continue;
			}
			if (key === "\t") {
				process.stdout.write(nowrite);
				continue;
			}
			str += key;
		}
		process.stdout.write(nowrite);
		str = str.slice(0, str.length - 1);
		return str;
	}
};
