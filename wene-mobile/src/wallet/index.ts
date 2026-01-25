import { Platform } from 'react-native';
import { MockWalletAdapter } from './MockWalletAdapter';
import { PhantomWalletAdapter } from './PhantomWalletAdapter';
import type { WalletAdapter } from './WalletAdapter';

/**
 * 環境に応じたWalletAdapterを取得
 * - iOS Simulator / 開発環境: MockWalletAdapter
 * - 実機（iOS/Android）: PhantomWalletAdapter
 */
export function getWalletAdapter(): WalletAdapter {
  // #region agent log
  const envMock = process.env.EXPO_PUBLIC_USE_MOCK_WALLET;
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined';
  const platform = Platform.OS;
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet/index.ts:13',message:'getWalletAdapter entry',data:{platform,isDev,envMock,hasEnvMock:envMock!==undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion
  
  // 環境変数で強制的にMockを使用する場合
  if (process.env.EXPO_PUBLIC_USE_MOCK_WALLET === 'true') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet/index.ts:17',message:'using MockWalletAdapter (env)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return new MockWalletAdapter();
  }

  // iOS Simulatorの場合はMockを使用
  if (Platform.OS === 'ios' && __DEV__) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet/index.ts:25',message:'using MockWalletAdapter (iOS dev)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Simulator判定（簡易版：実機がない場合のフォールバック）
    // 実際には、Phantomアプリがインストールされているかで判定する方が良い
    return new MockWalletAdapter();
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'wallet/index.ts:32',message:'using PhantomWalletAdapter',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion
  // デフォルトはPhantom
  return new PhantomWalletAdapter();
}

export { MockWalletAdapter, PhantomWalletAdapter };
export type { WalletAdapter, WalletConnectResult } from './WalletAdapter';
