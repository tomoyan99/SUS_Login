import crypto from "crypto";
import {hostname, totalmem} from "os";
import {readFileSync, writeFileSync} from "fs";
import * as os from "os";
import {replaceNumberWithWord} from "./myUtils.js";


class MyCrypt {
    private readonly ALGO = "aes-256-cbc"
    private readonly PASSWORD:string;
    private readonly SALT:string;
    private readonly PATH:string;
    private IV=undefined
    private BUF=undefined
    constructor(path:string) {
        const long_name = (str:string)=>{
            let a = "";
            for (let i = 0; i < str.length*50; i++) {
                a+=str;
            }
            return a;
        }
        const longhost = long_name(hostname());
        const longmem = long_name(totalmem().toString());
        // cpu名の文字数をコアの分x10ずつ総和
        const cpuredu = os.cpus().map((c)=>c.model.length).reduce((a,c)=>(a+c)*10,1).toString();
        // cpureduを数値から文字列に
        const cpuredu_nw = Array.from(cpuredu).sort().map((n)=>replaceNumberWithWord(n)).join("");
        const nlf = Array.from(new Set([cpuredu_nw]))
            .reduce((a,c)=>a.concat(
                Array.from(a.concat(c).join(""))
                    .sort()
                    .join("")),[]
            ).join("");
        this.PASSWORD =  this.createHush512(longhost+Buffer.from(nlf,"binary").toString("base64"));
        this.SALT = this.createHush512(longmem+Buffer.from(nlf,"binary").toString("hex"));
        this.PATH = path;
    }
    // 暗号化メソッド
    private encrypt() {
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
    private decrypt() {
        // 鍵を生成
        const key = crypto.scryptSync(password, salt, 32)
        // 復号器を生成
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        // encryptedData を復号
        let decryptedData = decipher.update(encryptedData)
        decryptedData =  Buffer.concat([decryptedData, decipher.final()])
        return decryptedData
    }
    private createHush512(data,encoding="utf8"){
        const sha512 = crypto.createHash('sha512')
        sha512.update(data)
        return sha512.digest(encoding);
    }
    private readBuffer(path){
        const Z = readFileSync(path,{encoding:"binary"});
        const A = Z.split("$$$$",-1);
        this.IV  = Buffer.from(A[0],"binary");
        this.BUF = Buffer.from(A[1],"binary");
    }
    private clearMember(){
        this.BUF = undefined;
        this.IV  = undefined;
    }
    //暗号書くやつ
    public async writeCrypt(inputData){
        return new Promise((resolve, reject)=>{
            if (typeof inputData !== "string"){
                inputData = JSON.stringify(inputData);
            }
            const bufdata = Buffer.from(inputData).toString("binary");
            const A = this.encrypt();
            this.IV  = A.iv;
            this.BUF = A.encryptedData;
            const outputData = `${this.IV.toString("binary")}$$$$${this.BUF.toString("binary")}`
            writeFileSync(this.PATH,outputData,{encoding:"binary"});
            this.clearMember();
            resolve();
        })
    }

    //平文出すやつ
    public async readPlane(){
        return new Promise((resolve)=>{
            this.readBuffer(this.PATH);
            const DE = this.decrypt();
            const Plane = Buffer.from(DE.toString(),"binary").toString("utf8");

            resolve(Plane);
        })
    }
}

const mc = new MyCrypt("./test/test.txt");

// export default MyCrypt;