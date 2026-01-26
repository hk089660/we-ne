/**
 * React Native 用ポリフィル
 * 必ず最初にインポートすること
 */

// crypto.getRandomValues polyfill - tweetnacl等が使用
import 'react-native-get-random-values';

// Buffer polyfill - @solana/web3.js が使用
import { Buffer } from 'buffer';

if (typeof global !== 'undefined') {
  (global as typeof globalThis & { Buffer?: typeof Buffer }).Buffer = Buffer;
}
