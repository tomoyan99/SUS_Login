import pkg from "../../../../package.json" assert { type: "json" };

const textDeco = {
  Title: (text) => `{#ba0486-bg}${text}{/}`,
  Chapter: (text) => `{#007e85-bg}${text}{/}`,
  Tab: (text) => `{#56c700-fg}${text}{/}`,
  Key: (text) => `{#e08300-fg}${text}{/}`,
};

export const description = {
  SUS_LOGIN:
    `${textDeco.Title(`SUS_LOGIN_${pkg.version}へようこそ！`)}\n\n` +
    `${textDeco.Chapter("[あらすじ]")}\n\n` +
    "   EUCの入力やSOLAの科目ページへのアクセスを簡単にするポータルアプリです！\n\n" +
    `${textDeco.Chapter("[操作方法]")}\n\n` +
    `   (この画面は${textDeco.Key("十字キー(↑ ↓ )")}でスクロール出来るよ！)\n\n` +
    `${textDeco.Chapter("[INFOタブへの移動]")}\n\n` +
    "   1.{#00ffc4-fg}ライトグリーン{/}の枠色が表示されている領域が\n" +
    "     「現在フォーカスされているタブ」です。\n" +
    `   2.${textDeco.Key("Tabキー")}、${textDeco.Key("Spaceキー")}を押すと${textDeco.Tab("INFOタブ")}にフォーカスが移ります。\n` +
    "   3.{#56c700-fg}INFOタブ{/}にフォーカスがある状態で{#e08300-fg}Enter{/}、{#e08300-fg}Tab{/}、{#e08300-fg}ESC{/}を押すと、\n" +
    "     {#56c700-fg}INFOタブ{/}の一つ前にフォーカスされていたタブにフォーカスが戻ります。\n\n" +
    `${textDeco.Chapter("[コマンド実行]")}\n\n` +
    `   1.${textDeco.Tab("COMMANDタブ")}のリスト上で${textDeco.Key("Enter")}を押すと、対応するコマンドが実行されます\n\n` +
    `     例えば、SCLASSコマンドを選択して${textDeco.Key("Enter")}を押すと、\n` +
    "     対応するSCLASSのページが開きます。\n\n" +
    `${textDeco.Chapter("[ツリーの開閉]")}\n\n` +
    '   1.コマンド名の右端の"{#fb00ff-fg}[+]{/}""{#008cff-fg}[-]{/}"はツリーの開閉状態を表しています\n' +
    '   2."{#fb00ff-fg}[+]{/}"の状態で{#e08300-fg}右(→){/}キーを押すとツリーが{#fb00ff-fg}開きます{/}\n' +
    '   3."{#008cff-fg}[-]{/}"の状態で{#e08300-fg}左(←){/}キーを押すとツリーが{#008cff-fg}閉じます{/}\n\n' +
    `${textDeco.Chapter("[アプリ終了]")}\n\n` +
    `   1.${textDeco.Key("Ctrl-C")}を押すか、{red-fg}QUIT{/}コマンドを選択すると、アプリが終了します\n\n` +
    "     お好きな方をどうぞ {red-fg}❤{/}",
  LOG: "EUCの登録ログを参照します！",
  IMAGE: "EUCの登録スクリーンショットを参照します！",
  QUIT: "{red-bg}終了します！{/}",
  EUC:
    "EUCで出席登録を行います！\n\n" +
    `${textDeco.Chapter("[説明]")}\n\n` +
    `   1.コマンドを実行すると${textDeco.Tab("INPUT_FORMタブ")}が現れます\n` +
    `     そこにEUCを入力し、完了したら${textDeco.Key("Enter")}を押してください\n` +
    "   2.バックグラウンドでSCLASSにアクセスし、EUCの登録を行います\n" +
    "   3.入力が終わると結果が表示ます\n" +
    "   4.登録成功時は、履歴がeuc.logとimagesフォルダ内に保存されます",
  SCLASS: "SCLASSを開きます",
  SOLA: "SOLAを開きます",
  履修仮組みツール: "履修仮組みツールを開きます",
  PAGE_LIST: "SOLAの科目ページリストを表示します",
  PAGE_RELOAD: "SOLAの科目ページリストを更新します",
  前期: "{#03dffc-fg}前{/}期科目ページリストです",
  後期: "{#fc03ba-fg}後{/}期科目ページリストです",
  戻る: "メニュー選択に戻ります",
};