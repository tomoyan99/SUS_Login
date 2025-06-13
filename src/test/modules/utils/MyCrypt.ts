import * as crypto from "crypto";
import * as keytar from "keytar";
import { readFileSync, writeFileSync } from "fs";

// 暗号・復号コントローラー (AES-256-GCM と keytar を使用)
class MyCrypt {
  private readonly ALGO = "aes-256-gcm";
  private readonly IV_LENGTH = 16; // GCMでは12バイトが推奨されることが多いが、16バイトも使用可能
  private readonly AUTH_TAG_LENGTH = 16;
  private masterKey: Buffer | null = null;

  /**
   * @param cryptDataPath 暗号化されたデータを保存するパス
   * @param serviceName キーチェーンに保存する際のサービス名
   * @param accountName キーチェーンに保存する際のアカウント名
   */
  constructor(
    private readonly cryptDataPath: string,
    private readonly serviceName: string,
    private readonly accountName: string,
  ) {}

  /**
   * キーチェーンからマスターキーを取得または生成して初期化する
   */
  private async initializeKey(): Promise<void> {
    if (this.masterKey) return;

    let keyHex = await keytar.getPassword(this.serviceName, this.accountName);

    if (!keyHex) {
      console.log(`[MyCrypt] Master key not found in keychain. Generating a new key for service "${this.serviceName}".`);
      const newKey = crypto.randomBytes(32); // 32バイト (256ビット) のマスターキー
      keyHex = newKey.toString("hex");
      await keytar.setPassword(this.serviceName, this.accountName, keyHex);
    }

    this.masterKey = Buffer.from(keyHex, "hex");
  }

  /**
   * データを暗号化してファイルに書き込む
   * @param inputData 文字列またはオブジェクト形式のデータ
   */
  public async writeCrypt(inputData: any): Promise<void> {
    await this.initializeKey();
    if (!this.masterKey) throw new Error("Master key could not be initialized.");

    const dataString = typeof inputData === "string" ? inputData : JSON.stringify(inputData);

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGO, this.masterKey, iv);

    const encrypted = Buffer.concat([cipher.update(dataString, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // IV、認証タグ、暗号化データを結合して保存
    const outputData = `${iv.toString("hex")}$$$$${authTag.toString("hex")}$$$$${encrypted.toString("hex")}`;
    writeFileSync(this.cryptDataPath, outputData, "utf-8");
  }

  /**
   * ファイルからデータを読み込み、復号して返す
   * @returns 復号された平文文字列
   */
  public async readPlane(): Promise<string> {
    await this.initializeKey();
    if (!this.masterKey) throw new Error("Master key could not be initialized.");

    const fileContent = readFileSync(this.cryptDataPath, "utf-8");
    const [ivHex, authTagHex, encryptedHex] = fileContent.split("$$$$");

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error("Invalid crypt file format.");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    if (iv.length !== this.IV_LENGTH || authTag.length !== this.AUTH_TAG_LENGTH) {
      throw new Error("Invalid crypt file format: IV or AuthTag length mismatch.");
    }

    const encryptedData = Buffer.from(encryptedHex, "hex");

    try {
      const decipher = crypto.createDecipheriv(this.ALGO, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      return decrypted.toString("utf8");
    } catch (error) {
      // 認証タグが一致しない（データが改ざんされている）場合、エラーが発生する
      throw new Error("Failed to decrypt data. It may be corrupted or tampered with.");
    }
  }
}

export default MyCrypt;
