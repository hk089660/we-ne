/**
 * Devnet 用 Grant 設定（devnetConfig）
 *
 * 【役割】
 * - DEV かつ cluster=devnet のとき、buildClaimTx が本物の authority/mint/grantId を使う
 * - _RAW が未設定（空）のときは null を返し、dummy にフォールバック
 *
 * 【設定方法】
 * grant_program の devnet_setup 実行後、出力された _RAW をそのまま貼り付け
 */

import { PublicKey } from '@solana/web3.js';

export interface DevnetGrantConfig {
  authority: PublicKey;
  mint: PublicKey;
  grantId: bigint;
  /** start_ts（unix timestamp）period_index 計算用 */
  startTs: bigint;
  /** period_seconds（30日 = 2592000） */
  periodSeconds: bigint;
}

/**
 * devnet_setup.ts の _RAW 出力をそのまま貼り付け
 */
const _RAW = {
  authority: '6MVimhATeGJrvNWYJcozsxMCWQK78oEM1sd6KqpMq3Kz',
  mint: '9g6BSqJBefXHLPhhdBTyGXNBuRPNqmJ9BedNc8ENnHL',
  grantId: '1',
  startTs: '1738281600',
  periodSeconds: '2592000',
};

function _parseConfig(): DevnetGrantConfig | null {
  if (!_RAW.authority || !_RAW.mint) {
    return null;
  }
  try {
    return {
      authority: new PublicKey(_RAW.authority),
      mint: new PublicKey(_RAW.mint),
      grantId: BigInt(_RAW.grantId || '1'),
      startTs: BigInt(_RAW.startTs || String(Math.floor(Date.now() / 1000) - 86400)),
      periodSeconds: BigInt(_RAW.periodSeconds || '2592000'),
    };
  } catch {
    return null;
  }
}

/** Devnet 時のみ有効。未設定時は null */
export const DEVNET_GRANT_CONFIG: DevnetGrantConfig | null = _parseConfig();
