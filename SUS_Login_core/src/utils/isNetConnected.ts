import dns from "dns";

//インターネットが繋がっているかをgoogleにアクセスして解決出来るかで判定
export function isNetConnected():Promise<boolean>{
    return new Promise((resolve)=>{
        // dnsサーバーにwww.google.comの名前解決を依頼
        dns.lookup('www.google.com', (err)=>{
            if (err && err.code === "ENOTFOUND") {
                //繋がってない
                resolve(false);
            } else {
                //繋がってる
                resolve(true);
            }
        });
    })
}