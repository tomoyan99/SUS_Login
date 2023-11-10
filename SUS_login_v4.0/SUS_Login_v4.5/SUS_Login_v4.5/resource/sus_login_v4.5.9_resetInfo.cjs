/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "readline":
/*!***************************!*\
  !*** external "readline" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("readline");

/***/ }),

/***/ "./util/input.js":
/*!***********************!*\
  !*** ./util/input.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   input: () => (/* binding */ input)\n/* harmony export */ });\n/* harmony import */ var readline__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! readline */ \"readline\");\n\r\n\r\n\r\nprocess.stdin.setEncoding('utf8');\r\nconst CtrlC = \"\\u0003\";\r\nconst erathe = \"\\b\\b\\x1b[0K\";\r\nconst nowrite = \"\\b\\x1b[0K\";\r\n\r\nconst inputKey = (prompt) => new Promise(resolve => {\r\n\tconst stdin = process.stdin;\r\n\tconst isRow = stdin.isRaw;\r\n\tconst callBack = (key = \"\") => {\r\n\t\tstdin.off(\"data\", callBack);\r\n\t\tstdin.pause();\r\n\t\tstdin.setRawMode(isRow);\r\n\t\t//上キーとかのエスケープで始まる文字は非表示\r\n\t\tif (key.charCodeAt(0) === 27) {\r\n\t\t\tresolve(\"\");//promiseの返り値としてkeyを返す\r\n\t\t} else {\r\n\t\t\tfor (const i of key) {\r\n\t\t\t\tprocess.stdout.write(\"*\");\r\n\t\t\t}\r\n\t\t\tresolve(key);//promiseの返り値としてkeyを返す\r\n\t\t}\r\n\t};\r\n\tstdin.setRawMode(true);//エンター以外の各キーを押したときもstdin.onを実行するようにする\r\n\tstdin.resume();//標準入力の待機状態にする\r\n\tstdin.on(\"data\", callBack);//キー入力を受け取る。キー内容はコールバック関数の第一引数として渡される\r\n});\r\n\r\n\r\n// 標準入力の受け取り\r\nasync function input(prompt, ishide = false) {\r\n\tif (ishide === false) {\r\n\t\t//readlineの入出力インターフェースを指定\r\n\t\tconst readInterface = (0,readline__WEBPACK_IMPORTED_MODULE_0__.createInterface)({\r\n\t\t\tinput: process.stdin,\r\n\t\t\toutput: process.stdout,\r\n\t\t});\r\n\t\treturn new Promise((resolve) => {\r\n\t\t\treadInterface.question(prompt, (input) => {\r\n\t\t\t\treadInterface.close();\r\n\t\t\t\tresolve(input);\r\n\t\t\t});\r\n\t\t});\r\n\t} else if (ishide === true) {\r\n\t\tlet key = \"\";\r\n\t\tprocess.stdout.write(prompt);\r\n\t\tlet str = \"\";\r\n\t\t//ENTARキーが押されるまでforループ\r\n\t\tfor (; ;) {\r\n\t\t\tkey = await inputKey();//入力したキーを孵す\r\n\t\t\t// console.log(key.charCodeAt(0));\r\n\t\t\t//ヌル文字～ユニット区切り文字は許さない\r\n\t\t\tif (key.charCodeAt(0) - 31 <= 0 && //ヌル文字～まで\r\n\t\t\t\t(key.charCodeAt(0) !== 13 && //スペース\r\n\t\t\t\t\tkey.charCodeAt(0) !== 8 && //バックスペース\r\n\t\t\t\t\tkey.charCodeAt(0) !== 3\t //Ctrl+C\r\n\t\t\t\t)) {\r\n\t\t\t\tprocess.stdout.write(nowrite);\r\n\t\t\t}\r\n\t\t\t//ENTERキーが押されたら終了\r\n\t\t\tif (key === \"\\x0d\") {\r\n\t\t\t\tprocess.stdout.write(nowrite);\r\n\t\t\t\tconsole.log();\r\n\t\t\t\treturn str;\r\n\t\t\t}\r\n\t\t\tif (key === CtrlC) {\r\n\t\t\t\tprocess.stdout.write(nowrite);\r\n\t\t\t\tprocess.exit(-1);//Ctrl+Cでプロセスの終了\r\n\t\t\t}\r\n\t\t\t//バックスペースが押されたとき\r\n\t\t\tif (key === \"\\b\") {\r\n\t\t\t\tif (str !== \"\") {\r\n\t\t\t\t\t//二文字消去して一つ前の入力も消去\r\n\t\t\t\t\tprocess.stdout.write(erathe);\r\n\t\t\t\t\tstr = str.slice(0, str.length - 1);\r\n\t\t\t\t} else {\r\n\t\t\t\t\tprocess.stdout.write(nowrite);\r\n\t\t\t\t}\r\n\t\t\t\tcontinue;\r\n\t\t\t}\r\n\t\t\t//タブが押されたとき\r\n\t\t\tif (key === \"\\t\") {\r\n\t\t\t\t//一文字消去して何もさせない\r\n\t\t\t\t// process.stdout.write(nowrite);\r\n\t\t\t\tkey = \"\";\r\n\t\t\t\tcontinue;\r\n\t\t\t}\r\n\t\t\tstr += key;\r\n\t\t}\r\n\t}\r\n};\r\n\n\n//# sourceURL=webpack://sus_login/./util/input.js?");

/***/ }),

/***/ "./util/reset.js":
/*!***********************!*\
  !*** ./util/reset.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   reset: () => (/* binding */ reset)\n/* harmony export */ });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n\r\n\r\n/*\r\n\t[reset.js]\r\n\tinfo.jsonをリセットする\r\n*/\r\n\r\n\r\nasync function reset(path) {\r\n\t//info.jsonのテンプレ\r\n\tconst info_json_raw = {\r\n\t\t\"username\": \"\",\r\n\t\t\"password\": \"\",\r\n\t\t\"sclass\": {\r\n\t\t\t\"url\": \"https://s-class.admin.sus.ac.jp/up/faces/login/Com00504A.jsp\",\r\n\t\t\t\"target\": {\r\n\t\t\t\t\"name\": \".inputText\",\r\n\t\t\t\t\"pass\": \".inputSecret\",\r\n\t\t\t\t\"submit\": \"input[type=image]\"\r\n\t\t\t}\r\n\t\t},\r\n\t\t\"sola\": {\r\n\t\t\t\"url\": \"https://sola.sus.ac.jp/\",\r\n\t\t\t\"target\": {\r\n\t\t\t\t\"name\": \"#identifier\",\r\n\t\t\t\t\"pass\": \"#password\",\r\n\t\t\t\t\"submit\": \"button[type=submit]\",\r\n\t\t\t}\r\n\t\t},\r\n\t\t\"last_upd\": \"\"\r\n\t};\r\n\r\n\ttry {\r\n\t\t(0,fs__WEBPACK_IMPORTED_MODULE_0__.writeFileSync)(path, JSON.stringify(info_json_raw));//info.jsonの初期化\r\n\t\treturn \"done\"\r\n\t}catch (e){\r\n\t\tthrow \"fault\"\r\n\t}\r\n}\n\n//# sourceURL=webpack://sus_login/./util/reset.js?");

/***/ }),

/***/ "./util/resetInfo.mjs":
/*!****************************!*\
  !*** ./util/resetInfo.mjs ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _input_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./input.js */ \"./util/input.js\");\n/* harmony import */ var _reset_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reset.js */ \"./util/reset.js\");\n\r\n/* \r\n\t[resetInfo.mjs]\r\n\treset.jsをウィザード化。独立したexeファイルとしてアプリ化する\r\n*/\r\n\r\n\r\n\r\n\r\n/* sleep関数 */\r\nconst sleep = msec => new Promise(resolve => setTimeout(resolve, msec));\r\n/* pause関数 */\r\nfunction pause(){\r\n\tconsole.log('何かキーを押して終了します');\r\n\tprocess.stdin.setRawMode(true);\r\n\tprocess.stdin.resume();\r\n\tprocess.stdin.on('data', process.exit.bind(process, 0));\r\n}\r\n\r\nconst version = \"2.0\";\r\n\t(async () => {\r\n\t\tconsole.clear();\r\n\t\tconsole.log(\"Reset.exe v\" + version);\r\n\t\tconsole.log(\"Reset.exeはパスワード入力などをミスしたときにinfo.jsonを初期化できるプログラムです\");\r\n\r\n\t\tconst count = await (async function inputYN() {\r\n\t\t\tconst yesno = await (0,_input_js__WEBPACK_IMPORTED_MODULE_0__.input)(\"初期化しますか？[Y/N]\\n\");\r\n\t\t\tswitch (true) {\r\n\t\t\t\tcase /[Yy]/.test(yesno):\r\n\t\t\t\t\tconsole.log(\"resource/data/info.jsonを初期化します\");\r\n\t\t\t\t\treturn 0;\r\n\t\t\t\tcase /[Nn]/.test(yesno):\r\n\t\t\t\t\tconsole.log(\"resource/data/info.jsonは初期化しません\");\r\n\t\t\t\t\treturn 1;\r\n\t\t\t\tdefault:\r\n\t\t\t\t\tconsole.log(\"Yy/Nnで入力してください\");\r\n\t\t\t\t\tawait inputYN();\r\n\t\t\t\t\treturn 0;\r\n\t\t\t}\r\n\t\t})();\r\n\t\tif (count === 1) {\r\n\t\t\tpause();\r\n\t\t}else{\r\n\t\t\tprocess.stdout.write(\"resource/data/info.jsonを初期化しています\");\r\n\r\n\t\t\tfor (let i = 0; i < 4; ++i) {\r\n\t\t\t\tawait sleep(500);\r\n\t\t\t\tprocess.stdout.write(\"・\");\r\n\t\t\t}\r\n\t\t\tif (await  (0,_reset_js__WEBPACK_IMPORTED_MODULE_1__.reset)(\"resource/data/info.json\") === \"done\"){\r\n\t\t\t\tconsole.log(\"\\nresource/data/info.jsonの初期化が完了しました\");\r\n\t\t\t}else{\r\n\t\t\t\tconsole.log(\"\\nresource/data/info.jsonの初期化に失敗しました\");\r\n\t\t\t}\r\n\t\t\tpause();\r\n\t\t}\r\n})();\t\n\n//# sourceURL=webpack://sus_login/./util/resetInfo.mjs?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./util/resetInfo.mjs");
/******/ 	
/******/ })()
;