import {readFileSync, writeFileSync} from 'fs';
/* sleep関数 */
export const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
/* writeJSON関数 */
export function writeJSON(dir, data) {
	if (typeof data === "string") {
		writeFileSync(dir, data);
	} else {
		writeFileSync(dir, JSON.stringify(data));
	}
}
export function importJSON(path=""){
	return JSON.parse(readFileSync(path,"utf8"));
}
export function isNumberInRange(number, min, max) {
	return number >= min && number <= max;
}

export function isObjEmpty(obj){
	return Object.keys(obj).length === 0
}