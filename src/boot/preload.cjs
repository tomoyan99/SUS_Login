const {contextBridge, ipcRenderer} = require("electron");
const {Terminal} = require("xterm")
const {FitAddon} = require("xterm-addon-fit")
const WebfontLoader = require("@liveconfig/xterm-webfont");
const {CanvasAddon} = require("xterm-addon-canvas")
const {WebglAddon} = require("xterm-addon-webgl")
const {WebLinksAddon} = require("xterm-addon-web-links");
const {userConfig} = require("./public/globalValues.cjs");

const term = new Terminal({
    cols:userConfig.defaultTerminalSize.cols,
    rows:userConfig.defaultTerminalSize.rows,
    cursorStyle:"bar",
    fontFamily:"myFont",
    fontSize:userConfig.defaultFontSize,
    fontWeight:"300",
    cursorBlink:false,
    letterSpacing:0,
    scrollback:0,
    theme:{
        background:"rgb(0,0,0)"
    }
})
function termer() {
    const termContent = document.getElementById('terminal');
    const fitAddon = new FitAddon();
    const loadA = new WebfontLoader();
    const webLink = new WebLinksAddon();
    // const canvasAddon = new CanvasAddon();
    const webGLAddon = new WebglAddon();
    webGLAddon.onContextLoss(e => {
        webGLAddon.dispose();
    });

    // アドオンをロード
    term.loadAddon(fitAddon);
    term.loadAddon(loadA);
    term.loadAddon(webLink);
    // term.loadAddon(canvasAddon);
    term.loadAddon(webGLAddon);
    //コンテンツをロード
    term.loadWebfontAndOpen(termContent);

    //Ctrl+Cで選択範囲をクリップボードにコピー可能にする
    term.attachCustomKeyEventHandler((arg) => {
        if (arg.ctrlKey && arg.code === "KeyC" && arg.type === "keydown") {
            const selection = term.getSelection();
            if (selection) {
                navigator.clipboard.readText()
                return false;
            }
        }
        return true;
    });

    let isFocused = false;
    //node-ptyの標準出力をブラウザに表示する
    ipcRenderer.on("terminal.incomingData", (event, data) => {
        if (!isFocused){
            //ターミナルをフォーカス
            term.focus();
            //ウィンドウサイズに合わせてターミナルサイズを合わせる
            fitAddon.fit();
            isFocused = true;
        }
        term.write(data);
    });

    //electron-menuをイジってフォントサイズの変更
    ipcRenderer.on("terminal.fontsize",(event, delta)=>{
        if (delta === "default"){
            term.options.fontSize = 17;
        }else{
            const expectedSize = term.options.fontSize + delta;
            if (expectedSize > 11 && expectedSize < 23){
               term.options.fontSize += delta;
            }
        }
        clearTimeout(timeoutID);
        timeoutID = setTimeout(()=>{
            //フォントサイズに合わせてターミナルサイズを合わせる
            fitAddon.fit();
        }, 1000);
    });

    //terminalのoptionを送信
    ipcRenderer.on("terminal.requestOptions",()=>{
        ipcRenderer.send("terminal.sendOptions", term.options);
    });

    //ブラウザ側でのキー入力をnode-ptyに送る
    term.onData(e => {
        ipcRenderer.send("terminal.keystroke", e);
    });

    //xtermのresizeをnode-ptyに伝播。fitされたら発火
    term.onResize((size) => {
        const resizer = [size.cols, size.rows];
        ipcRenderer.send("terminal.resize", resizer);
    });

    //画面がリサイズされたらそれに合わせてターミナルサイズをフィットさせる
    //リサイズが終了してから発火
    let timeoutID;
    window.addEventListener("resize",()=>{
        clearTimeout(timeoutID);
        timeoutID = setTimeout(()=>{
            fitAddon.fit();
        }, 500);
    });
}
//contextBridgeにtermer関数を接続
contextBridge.exposeInMainWorld('testapi', {
    termer: termer,
})