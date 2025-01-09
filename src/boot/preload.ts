import {contextBridge, ipcRenderer} from "electron";
import {Terminal} from "xterm";
import {FitAddon} from "xterm-addon-fit";
import XtermWebfont from "./xtermWebfont";
import {WebglAddon} from "xterm-addon-webgl";
import {WebLinksAddon} from "xterm-addon-web-links";

async function termer() {
    const viewConfig = await ipcRenderer.invoke("getViewConfig");
    const term = new Terminal({
        cols:viewConfig.defaultTerminalSize.cols,
        rows:viewConfig.defaultTerminalSize.rows,
        cursorStyle:"bar",
        fontFamily:"myFont",
        fontSize:viewConfig.defaultFontSize,
        fontWeight:"300",
        cursorBlink:false,
        letterSpacing:0,
        scrollback:0,
        theme:{
            background:"rgb(0,0,0)"
        },
    });

    const termContent = document.getElementById('terminal');
    const fitAddon = new FitAddon();
    const loadFont = new XtermWebfont();
    const webLink = new WebLinksAddon();
    let timeoutID: string | number | NodeJS.Timeout | undefined;
    // const canvasAddon = new CanvasAddon();
    const webGLAddon = new WebglAddon();
    webGLAddon.onContextLoss(e => {
        webGLAddon.dispose();
    });
    // アドオンをロード
    term.loadAddon(fitAddon);
    term.loadAddon(loadFont);
    term.loadAddon(webLink);
    // term.loadAddon(canvasAddon);
    term.loadAddon(webGLAddon);
    if (termContent && "loadWebfontAndOpen" in term) {
        //フォントをロード
      term.loadWebfontAndOpen(termContent);
    }
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
        if (timeoutID){
            clearTimeout(timeoutID);
        }
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

    window.addEventListener("DOMContentLoaded", ()=>{
       fitAddon.fit();
    });

    //画面がリサイズされたらそれに合わせてターミナルサイズをフィットさせる
    //リサイズが終了してから発火
    window.addEventListener("resize",()=>{
        if (timeoutID){
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(()=>{
            fitAddon.fit();
        }, 500);
    });
}
//contextBridgeにtermer関数を接続
contextBridge.exposeInMainWorld('testapi', {
    termer: termer,
})