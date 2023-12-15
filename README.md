# SUS_Login
公立諏訪東京理科大学専用の総合ユーティリティーシステムです  

<img width="50%" height="50%" alt="SUS_Login_Home" src="https://github.com/tomoyan99/SUS_Login/assets/101825008/3161a0a6-1a1a-40c9-b3c3-0f6038b79136"><img width="50%" height="50%" alt="SUS_Login_PageList" src="https://github.com/tomoyan99/SUS_Login/assets/101825008/30f4c6fa-6f2c-4dc4-83fa-a739e4a81980">
## 概要
公立諏訪東京理科大学における2つのポータルサイト、S-CLASSとSOLAへのアクセス及び出席登録の簡略化を目的として作成しました。  
本校の授業時間は1時限につき100分。なのにポータルサイトのログイン状態は30分で切れるアンバランスさ。  
さらにその度に毎回マウスカーソルを小さいボタンにエイムを合わせカチカチする日々。  
そこで、思い立ったが100年、nodejs+pupetterを使った小さな自動ログインアプリが始まりでした……！

## 機能
主な4つの機能  
1. 出席登録システム「EUC」の全自動化　　
2. S-CLASSへのアクセス及びログイン　　
3. SOLAへのアクセス及びログイン　　
4. 履修している科目が一目で分かって、即ページに飛べる「SOLA-PageList」   

その他の機能
- SOLA-PageListを更新できるPAGE-Reload
- 過去に登録したEUCが分かるLOG機能（遅刻してきた友達におすすめ❤）
- 証拠としてのEUC登録画面のスクリーンショット

## 使い方
1. [リリースページ](https://github.com/tomoyan99/SUS_Login/releases)から最新版のインストーラーをダウンロード！（たぶん一番上のでたいじょぶ）
2. インストール手順に従ってインストール！（`%LOCALAPPDATA%/Programs/SUS_Login_v~~`が多分デフォルト）
3. インストールが完了したらアプリの指示に従って入力してください。一度アプリは落ちますが、もう一度開けば使用可能です！
4. <span style="color:red">アンインストール</span>したいときは同じく`%LOCALAPPDATA%/Programs/SUS_Login_v~~`にある`uninstall~~`から始まるexeを実行すればアンインストールできます
