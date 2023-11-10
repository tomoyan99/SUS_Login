"use strict";
/* 
	[existChromePath.js]
	ローカルにChromeが存在するかを確認して、一つでも存在するならtrueを返す
*/


import { join } from 'path';
import { existsSync } from 'fs';

export function existChromePath() {

	const suffix = `\\Google\\Chrome\\Application\\chrome.exe`;//chrome.exeまでのサフィックス
	//ローカル依存のプレフィックス
	const prefixes = [
		process.env.LOCALAPPDATA,
		process.env.PROGRAMFILES,
		process.env['PROGRAMFILES(X86)']
	].filter(Boolean);//空の値を削除
	//ファイルが存在するかを各パスに確認
	return prefixes.map(prefix => existsSync(join(prefix, suffix))).filter(Boolean);
}