const {contextBridge, ipcRenderer} = require("electron");
const {Terminal} = require("xterm")
const {FitAddon} = require("xterm-addon-fit")


const term = new Terminal({
    cols:82,
    rows:33,
    cursorStyle:"bar",
    fontFamily:"UDEV Gothic JPDOC",
    fontSize:17,
    fontWeight:"400",
    cursorBlink:false,
    letterSpacing:2,
    theme:{
        background:"rgb(0,0,0)"
    }
})
function termer() {
    const termContent = document.getElementById('terminal');
    const fitAddon = new FitAddon();

    // アドオンをロード
    term.loadAddon(fitAddon);

    term.open(termContent);

    //ターミナルをフォーカス
    term.focus();

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

    //画面サイズに合わせてターミナルサイズを合わせる
    fitAddon.fit();
    //node-ptyの標準出力をブラウザに表示する
    ipcRenderer.on("terminal.incomingData", (event, data) => {
        term.write(data);
    });

    //ブラウザ側でのキー入力をnode-ptyに送る
    term.onData(e => {
        ipcRenderer.send("terminal.keystroke", e);
    });

    //画面がリサイズされたらそれに合わせてターミナルサイズをフィットさせる
    window.addEventListener("resize",()=>{
        fitAddon.fit();
    });
}
//contextBridgeにtermer関数を接続
contextBridge.exposeInMainWorld('testapi', {
    termer: termer,
})