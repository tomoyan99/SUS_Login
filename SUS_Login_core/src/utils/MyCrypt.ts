import * as crypto from "crypto";
import * as os from "os";
import {hostname, totalmem} from "os";
import {readFileSync, writeFileSync} from "fs";
import {replaceNumberWithWord} from "./myUtils";

// 暗号・復号コントローラー
class MyCrypt {
  private readonly ALGO = "aes-256-cbc";
  private readonly PASSWORD: string;
  private readonly SALT: string;
  private IV: Buffer | undefined;
  private BUF: Buffer | undefined;

  // 暗号・復号データを保存するパス
  constructor(private readonly PATH: string) {
    const long_name = (str: string) => {
      let a = "";
      for (let i = 0; i < str.length * 50; i++) {
        a += str;
      }
      return a;
    };
    const long_host = long_name(hostname());
    const long_mem = long_name(totalmem().toString());
    // cpu名の文字数をコアの分x10ずつ総和
    const cpu_name_sum = os
      .cpus()
      .map((c) => c.model.length + hostname().length * 20)
      .reduce((a, c) => (a + c) * 10, 1)
      .toString()
      .split("");
    // cpu_nameを数値から文字列に(fivezerozeroone～みたいになる)
    const cpu_name_sum_word = cpu_name_sum
      .map((n) => replaceNumberWithWord(parseInt(n)))
      .join("");
    // cpu_name_sum_wordを一文字ずつの配列に
    const cpu_name_sum_array = cpu_name_sum_word.split("");
    // データを冗長化するための余計な文字列
    const extension = cpu_name_sum_array
      .reduce(
        (a, c) => {
          const s = `${(c.codePointAt(0) ?? 0) ** 2}`
            .split("")
            .map((d) => {
              return `${(d.codePointAt(0) ?? 0) ** (c.codePointAt(0) ?? 0)}`;
            })
            .join("");
          const ss = s
            .split("")
            .map((d) => {
              return `${((d.codePointAt(0) ?? 0) ** parseInt(d)).toString(16).toUpperCase()}`;
            })
            .join("");
          return [...a, ss];
        },
        <string[]>[],
      )
      .join("");
    // パスワードのハッシュ
    this.PASSWORD = this.createHush512(
      long_host + Buffer.from(extension, "binary").toString("base64"),
    );
    // ソルトのハッシュ
    this.SALT = this.createHush512(
      long_mem + Buffer.from(extension, "binary").toString("hex"),
    );
  }

  //暗号書くやつ
  public async writeCrypt(inputData: any): Promise<void> {
    if (typeof inputData !== "string") {
      inputData = JSON.stringify(inputData);
    }
    const string_data = Buffer.from(inputData).toString("binary");
    const A = this.encrypt(string_data);
    this.IV = A.iv;
    this.BUF = A.encryptedData;
    const outputData = `${this.IV.toString("binary")}$$$$${this.BUF.toString("binary")}`;
    writeFileSync(this.PATH, outputData, { encoding: "binary" });
    this.clearMember();
  }

  //平文出すやつ
  public async readPlane(): Promise<string> {
    this.readBuffer();
    const DE = this.decrypt();
    const Plane = Buffer.from(DE.toString(), "binary").toString("utf8");
    return Plane;
  }

  // 暗号化メソッド
  private encrypt(string_data: string) {
    // 鍵を生成
    const key = crypto.scryptSync(this.PASSWORD, this.SALT, 32);
    // IV を生成
    const iv = crypto.randomBytes(16);
    // 暗号器を生成
    const cipher = crypto.createCipheriv(this.ALGO, key, iv);
    // data を暗号化
    let encryptedData = cipher.update(string_data);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);
    return { iv, encryptedData };
  }

  // 復号メソッド
  private decrypt() {
    if (this.BUF && this.IV) {
      // 鍵を生成
      const key = crypto.scryptSync(this.PASSWORD, this.SALT, 32);
      // 復号器を生成
      const decipher = crypto.createDecipheriv(this.ALGO, key, this.IV);
      // encryptedData を復号
      let decryptedData = decipher.update(this.BUF);
      decryptedData = Buffer.concat([decryptedData, decipher.final()]);
      return decryptedData;
    } else {
      throw "this.BUF or this.IV is undefined";
    }
  }

  // ハッシュを生成するやつ
  private createHush512(data: string, encoding = "utf8") {
    const sha512 = crypto.createHash("sha512");
    sha512.update(data);
    return sha512.digest(<crypto.BinaryToTextEncoding>encoding);
  }

  // ファイルからBUFとIVを読み出すやつ
  private readBuffer() {
    const Z = readFileSync(this.PATH, { encoding: "binary" });
    const A = Z.split("$$$$", -1);
    if (typeof A[0] === "string" && typeof A[1] === "string") {
      this.IV = Buffer.from(A[0], "binary");
      this.BUF = Buffer.from(A[1], "binary");
    }
  }

  // メンバをクリアするやつ
  private clearMember() {
    this.BUF = undefined;
    this.IV = undefined;
  }
}

export default MyCrypt;