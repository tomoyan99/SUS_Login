import ora, { Ora } from 'ora';

class WaitAccessMessage {
  private readonly title: string;
  private spinner: Ora | null = null;

  /**
   * @param title メッセージの先頭に表示するタイトル
   */
  constructor(title: string) {
    this.title = title;
  }

  /**
   * 指定されたメッセージでスピナーを開始します。
   * @param initialMessage 表示する最初のメッセージ
   */
  public consoleOn(initialMessage: string = "処理中...") {
    // 既にスピナーが動作中の場合は何もしない
    if (this.spinner?.isSpinning) {
      return;
    }

    this.spinner = ora({
      text: `[${this.title}] ${initialMessage}`,
      spinner: "dots", // スピナーの種類 (他にも色々あります)
    }).start();
  }

  /**
   * 進行中のメッセージを更新します。
   * @param newMessage 新しいメッセージ
   */
  public updateMessage(newMessage: string) {
    if (this.spinner) {
      this.spinner.text = `[${this.title}] ${newMessage}`;
    }
  }

  /**
   * スピナーを停止し、完了メッセージを表示します。
   * @param success 処理が成功したかどうか
   * @param finalMessage 表示する最終メッセージ（省略可能）
   */
  public consoleOff(success: boolean, finalMessage?: string) {
    if (!this.spinner) return;

    // メッセージが指定されていれば、それを最終メッセージとして設定
    if (finalMessage) {
      this.updateMessage(finalMessage);
    }

    if (success) {
      this.spinner.succeed(); // ✔ 緑色の成功メッセージ
    } else {
      this.spinner.fail(); // ✖ 赤色の失敗メッセージ
    }
    this.spinner = null;
  }
}

export default WaitAccessMessage;
