const crypto = require('crypto')
const {hostname, cpus, homedir, totalmem} = require("os");
const {writeFile, writeFileSync, readFileSync} = require("fs");

export class MyCrypt {
    #ALGO = "aes-256-cbc"
    #PASSWORD = undefined
    #SALT = undefined
    #MESSAGE = ""
    #IV=undefined
    #BUF=undefined
    constructor(target_str) {
        const long_name = (str)=>{
            let a = "";
            for (let i = 0; i < str.length*50; i++) {
                a+=str;
            }
            return a;
        }
        const longhost = long_name(hostname());
        const longmem = long_name(totalmem());
        const mll = process.moduleLoadList.join("");
        this.#PASSWORD =  this.#createHush512(longhost+Buffer.from(mll,"binary").toString("base64"));
        this.#SALT = this.#createHush512(longmem+Buffer.from(mll,"binary").toString("hex"));
        const buftxt = Buffer.from(target_str).toString("binary");
        this.#MESSAGE = buftxt;
    }
    // 暗号化メソッド
    #encrypt(algorithm, password, salt, data) {
        // 鍵を生成
        const key = crypto.scryptSync(password, salt, 32)
        // IV を生成
        const iv = crypto.randomBytes(16)
        // 暗号器を生成
        const cipher = crypto.createCipheriv(algorithm, key, iv)
        // data を暗号化
        let encryptedData = cipher.update(data)
        encryptedData = Buffer.concat([encryptedData, cipher.final()])
        return {iv, encryptedData}
    }
    // 復号メソッド
    #decrypt(algorithm, password, salt, iv, encryptedData) {
        // 鍵を生成
        const key = crypto.scryptSync(password, salt, 32)
        // 復号器を生成
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        // encryptedData を復号
        let decryptedData = decipher.update(encryptedData)
        decryptedData =  Buffer.concat([decryptedData, decipher.final()])
        return decryptedData
    }
    #createHush512(data,encoding="utf8"){
        const sha512 = crypto.createHash('sha512')
        sha512.update(data)
        const sha512Hash = sha512.digest(encoding)
        return sha512Hash;
    }
    #readBuffer(path){
        const Z = readFileSync(path,{encoding:"binary"});
        const A = Z.split("$$$$",-1);
        this.#IV  = Buffer.from(A[0],"binary");
        this.#BUF = Buffer.from(A[1],"binary");
    }
    #clearMember(){
        this.#BUF = undefined;
        this.#IV  = undefined;
    }
    //暗号書くやつ
    writeCrypt(path){
        const A = this.#encrypt(this.#ALGO,this.#PASSWORD,this.#SALT,this.#MESSAGE);
        this.#IV  = A.iv;
        this.#BUF = A.encryptedData;
        const data = `${this.#IV.toString("binary")}$$$$${this.#BUF.toString("binary")}`
        writeFileSync(path,data,{encoding:"binary"});
        this.#clearMember();
    }

    //平文出すやつ
    readPlane(path){
        this.#readBuffer(path);
        const DE = this.#decrypt(this.#ALGO,this.#PASSWORD,this.#SALT,this.#IV,this.#BUF);
        return Buffer.from(DE.toString(),"binary").toString("utf8")
    }
}
