import crypto from "crypto";

import {hostname, totalmem} from "os";

import {readFileSync, writeFileSync} from "fs";
import * as os from "os";
import {replaceNumberWithWord} from "./myUtils.js";


class MyCrypt {
    #ALGO = "aes-256-cbc"
    #PASSWORD = undefined
    #SALT = undefined
    #PATH = ""
    #IV=undefined
    #BUF=undefined
    constructor(path) {
        const long_name = (str)=>{
            let a = "";
            for (let i = 0; i < str.length*50; i++) {
                a+=str;
            }
            return a;
        }
        const longhost = long_name(hostname());
        const longmem = long_name(totalmem().toString());
        const cpuredu = os.cpus().map((c)=>c.model.length).reduce((a,c)=>(a+c)*10,1).toString();
        const cpuredu_nw = Array.from(cpuredu).sort().map((n)=>replaceNumberWithWord(n)).join("");
        const nlf = Array.from(new Set(Array.from(cpuredu_nw))).reduce((a,c)=>a.concat(Array.from(a.concat(c).join("")).sort().join("")),[]).join("");
        this.#PASSWORD =  this.#createHush512(longhost+Buffer.from(nlf,"binary").toString("base64"));
        this.#SALT = this.#createHush512(longmem+Buffer.from(nlf,"binary").toString("hex"));
        this.#PATH = path;
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
        return sha512.digest(encoding);
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
    async writeCrypt(inputData){
        return new Promise((resolve, reject)=>{
            if (typeof inputData !== "string"){
                inputData = JSON.stringify(inputData);
            }
            const bufdata = Buffer.from(inputData).toString("binary");
            const A = this.#encrypt(this.#ALGO,this.#PASSWORD,this.#SALT,bufdata);
            this.#IV  = A.iv;
            this.#BUF = A.encryptedData;
            const outputData = `${this.#IV.toString("binary")}$$$$${this.#BUF.toString("binary")}`
            writeFileSync(this.#PATH,outputData,{encoding:"binary"});
            this.#clearMember();
            resolve();
        })
    }

    //平文出すやつ
    async readPlane(){
        return new Promise((resolve)=>{
            this.#readBuffer(this.#PATH);
            const DE = this.#decrypt(this.#ALGO,this.#PASSWORD,this.#SALT,this.#IV,this.#BUF);
            const Plane = Buffer.from(DE.toString(),"binary").toString("utf8");

            resolve(Plane);
        })
    }
}

export default MyCrypt;