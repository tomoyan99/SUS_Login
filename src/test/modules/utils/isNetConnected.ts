import { Resolver } from "dns/promises";

const resolver = new Resolver({ timeout: 3000 }); // 3秒でタイムアウト

// 信頼できるDNSサーバーリスト
const dnsServers = ["1.1.1.1", "8.8.8.8"];
resolver.setServers(dnsServers);

/**
 * インターネットに接続されているかを複数のDNSサーバーへの問い合わせで判定
 * @returns 接続されていればtrue, そうでなければfalse
 */
export async function isNetConnected(): Promise<boolean> {
  try {
    // Promise.anyはいずれかのPromiseが成功したらすぐに解決する
    // これにより、単一のDNSサーバーの障害に影響されにくくなる
    const a = await Promise.any([
      resolver.resolve("www.google.com"),
      resolver.resolve("www.cloudflare.com"),
    ]);
    console.log(a)
    return true;
  } catch (error) {
    // すべての問い合わせが失敗した場合
    return false;
  }
}
