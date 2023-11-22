import dns from "dns";

export function isNetConnected(){
    return new Promise((resolve,reject)=>{
        //インターネットが繋がっているかをgoogleにアクセスして解決出来るかで判定
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


// setInterval(async ()=>{
//     console.log(await isNetConnected())
// },1000);