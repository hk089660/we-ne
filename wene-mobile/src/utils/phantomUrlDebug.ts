/**
 * Phantom URL のデバッグ用。DEV画面に表示してコピーしやすくする。
 * redirect_link の encode 検証用。
 */
let lastConnectUrl = '';
let lastSignUrl = '';
let lastRedirectLinkRaw = '';
let lastRedirectLinkEncoded = '';

export function setLastPhantomConnect(url: string, redirectRaw: string, redirectEncoded: string): void {
  lastConnectUrl = url;
  lastRedirectLinkRaw = redirectRaw;
  lastRedirectLinkEncoded = redirectEncoded;
}

export function setLastPhantomSign(url: string, redirectRaw: string, redirectEncoded: string): void {
  lastSignUrl = url;
  lastRedirectLinkRaw = redirectRaw;
  lastRedirectLinkEncoded = redirectEncoded;
}

export function getLastPhantomDebug(): {
  connectUrl: string;
  signUrl: string;
  redirectRaw: string;
  redirectEncoded: string;
} {
  return {
    connectUrl: lastConnectUrl,
    signUrl: lastSignUrl,
    redirectRaw: lastRedirectLinkRaw,
    redirectEncoded: lastRedirectLinkEncoded,
  };
}
