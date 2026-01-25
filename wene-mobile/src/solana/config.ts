import { Connection, Cluster, PublicKey } from '@solana/web3.js';
import { Platform } from 'react-native';

/**
 * Grant Program ID
 */
export const GRANT_PROGRAM_ID = new PublicKey('8SVRtAyWXcd47PKeeMSGpC1oQFNt2yM865M46QgjKUZ');

/**
 * Solana RPC接続先（環境変数から取得、デフォルトはdevnet）
 */
export const getRpcUrl = (): string => {
  // #region agent log
  const envRpc = process.env.SOLANA_RPC_URL;
  const rpcUrl = envRpc || 'https://api.devnet.solana.com';
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'config.ts:13',message:'getRpcUrl called',data:{platform:Platform.OS,hasEnvRpc:envRpc!==undefined,envRpc,rpcUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  // 環境変数から取得（未設定の場合はdevnet）
  return rpcUrl;
};

/**
 * Solana接続を作成
 */
export const createConnection = (): Connection => {
  const rpcUrl = getRpcUrl();
  return new Connection(rpcUrl, 'confirmed');
};

/**
 * クラスター名を取得
 */
export const getCluster = (): Cluster => {
  const rpcUrl = getRpcUrl();
  if (rpcUrl.includes('devnet')) {
    return 'devnet';
  } else if (rpcUrl.includes('testnet')) {
    return 'testnet';
  } else if (rpcUrl.includes('mainnet')) {
    return 'mainnet-beta';
  }
  return 'devnet';
};
