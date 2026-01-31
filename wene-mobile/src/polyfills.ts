/**
 * React Native 用ポリフィル
 * web3.js / anchor / bs58 / tweetnacl が必須とする global を必ず設定する。
 * エントリ（index.js）で最上部 import され、他のモジュールより先に実行されること。
 */

// 1. crypto.getRandomValues - tweetnacl, Keypair 等が使用（最初に必要）
import 'react-native-get-random-values';

// crypto 参照落ち防止（getRandomValues は上記で注入済み）
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = {};
}

// 2. Buffer - @solana/web3.js / bs58 が使用
import { Buffer } from 'buffer';

// 3. TextEncoder / TextDecoder - web3.js / tweetnacl 内部で参照（RN Android で undefined になる対策）
import { TextEncoder, TextDecoder } from 'text-encoding';

// 4. process - buffer / bn.js / web3.js 内部依存（process パッケージで実体を渡す）
import process from 'process';

const g = typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : ({} as any));

g.Buffer = Buffer;
g.global = g;
g.TextEncoder = TextEncoder;
g.TextDecoder = TextDecoder;
g.process = process;

// 起動時1回: polyfills 最終検証ログ（原因特定用）
console.log(
  '[POLYFILLS] Buffer',
  !!g.Buffer,
  'process',
  !!g.process,
  'crypto',
  !!(g as any).crypto,
  'TextEncoder',
  !!g.TextEncoder,
  'TextDecoder',
  !!g.TextDecoder
);

// 起動時1回: JSエンジン判定（Hermes 標準・調査用）
console.log('[JS_ENGINE]', (g as any).HermesInternal ? 'hermes' : 'non-hermes');

// Phantom deeplink listener をアプリ起動時に1回だけ登録（React マウント前）
import { Platform } from 'react-native';
import { setupPhantomDeeplinkListener } from './utils/phantomDeeplinkListener';
if (Platform.OS !== 'web') {
  setupPhantomDeeplinkListener();
}
