/**
 * Solana Configuration
 *
 * 【安定性のポイント】
 * - Program ID は一箇所で定義（Anchor.toml, declare_id!() と一致）
 * - Cluster / RPC は cluster.ts で集約
 * - Connection は singleton.ts で管理
 */

import { PublicKey } from '@solana/web3.js';
import { DEFAULT_CLUSTER, getRpcUrl as getClusterRpcUrl } from './cluster';
import type { SolanaCluster } from './cluster';

// ============================================================
// Program ID（cluster 別）
// ============================================================

/** devnet デプロイ先（keypair から決定） */
const DEVNET_PROGRAM_ID = new PublicKey(
  'GZcUoGHk8SfAArTKicL1jiRHZEQa3EuzgYcC2u4yWfSR'
);

/** mainnet 用（未デプロイ時は localnet と同じ） */
const MAINNET_PROGRAM_ID = new PublicKey(
  '8SVRtAyWXcd47PKeeMSGpC1oQFNt2yM865M46QgjKUZ'
);

/**
 * クラスターに応じた Grant Program ID
 */
export function getGrantProgramId(cluster: SolanaCluster = DEFAULT_CLUSTER): PublicKey {
  return cluster === 'devnet' ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID;
}

/**
 * 現在クラスター用の Grant Program ID（後方互換）
 */
export const GRANT_PROGRAM_ID = getGrantProgramId(DEFAULT_CLUSTER);

// ============================================================
// Cluster / RPC（cluster.ts から取得、後方互換用）
// ============================================================

/**
 * @deprecated cluster.ts の DEFAULT_CLUSTER を使用してください
 */
export const CLUSTER: SolanaCluster = DEFAULT_CLUSTER;

/**
 * @deprecated cluster.ts の getRpcUrl() または singleton の RPC_URL を使用してください
 */
export const RPC_URL: string = getClusterRpcUrl(DEFAULT_CLUSTER);

/**
 * @deprecated singleton.ts の getConnection() を使用してください
 */
export const getRpcUrl = (): string => getClusterRpcUrl(DEFAULT_CLUSTER);

/**
 * @deprecated cluster.ts の DEFAULT_CLUSTER を使用してください
 */
export const getCluster = (): SolanaCluster => DEFAULT_CLUSTER;
