/**
 * エントリポイント - polyfills を最上部で読み込み、その後 expo-router を起動する。
 * web3.js 等が global.Buffer / global.process を参照するため、
 * 他のモジュールが読み込まれる前に必ず polyfills を実行する。
 */
import './src/polyfills';
import 'expo-router/entry';
