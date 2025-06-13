import { join } from "path";
import { existsSync } from "fs";

/**
 * ローカルにChromeが存在するかを確認し、存在すればそのパスを返す
 * @returns Chromeの実行可能ファイルパス。見つからなければnull。
 */
export function getChromePath(): string | null {
  const prefixes: string[] = [
    process.env.LOCALAPPDATA,
    process.env.PROGRAMFILES,
    process.env["PROGRAMFILES(X86)"],
  ].filter((p): p is string => typeof p === "string");

  const suffix = `\\Google\\Chrome\\Application\\chrome.exe`;

  switch (process.platform) {
    case "win32": // Windows
      for (const prefix of prefixes) {
        const chromePath = join(prefix, suffix);
        if (existsSync(chromePath)) {
          return chromePath;
        }
      }
      return null;

    case "darwin": // macOS
      const darwinPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      if (existsSync(darwinPath)) {
        return darwinPath;
      }
      return null;

    case "linux": // Linux
      // Linuxでは `which` や `command -v` を使ってコマンド検索するのが一般的ですが、
      // Node.jsの標準機能だけだと複雑になるため、よくあるパスをチェックします。
      const linuxPaths = [
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/opt/google/chrome/chrome",
      ];
      for (const path of linuxPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
      return null;

    default:
      return null;
  }
}
