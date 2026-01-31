// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// buffer polyfill - @solana/web3.js が React Native で動作するため
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = config.resolver.extraNodeModules || {};
config.resolver.extraNodeModules.buffer = require.resolve('buffer/');

// キャッシュを無効化する設定（開発時のみ）
if (process.env.EXPO_NO_CACHE === '1') {
  config.cacheStores = [];
  config.resetCache = true;
}

module.exports = config;
