const {execSync, execFileSync} = require('child_process');

(async function main(){
	console.clear();
	try {
		const stdout = execSync("resource\\nodejs\\node.exe resource\\login.js",{maxBuffer: 200*1024,stdio:"inherit"});	
	} catch (e) {
		console.log();
	}finally{
		pause();
	}
})();

function pause() {
	console.log('何かキーを押して終了します');
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));	
}
