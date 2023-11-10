const path = require('path');
const fs = require('fs');

module.exports = function existChromePath() {
	const suffix = `\\Google\\Chrome\\Application\\chrome.exe`;
	const prefixes = [
		process.env.LOCALAPPDATA,
		process.env.PROGRAMFILES,
		process.env['PROGRAMFILES(X86)']
	].filter(Boolean);//空の値を削除
	return prefixes.map(prefix => fs.existsSync(path.join(prefix, suffix))).filter(Boolean);
}