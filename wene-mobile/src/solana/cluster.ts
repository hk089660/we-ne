/**
 * Solana Cluster 定義
 *
 * RPC は devnet に完全固定（Phantom の mainnet 誤認を防ぐ）。
 * mainnet / testnet / env 分岐は排除し、以下のみを使用する。
 */

export type SolanaCluster = 'devnet' | 'mainnet-beta';

/** devnet 用 RPC（完全固定。env や cluster 分岐なし） */
export const DEVNET_RPC_FIXED = 'https://api.devnet.solana.com';

/**
 * デフォルトクラスター（常に devnet）
 */
export const DEFAULT_CLUSTER: SolanaCluster = 'devnet';

/**
 * RPC URL を取得（常に devnet 固定）
 */
export function getRpcUrl(_cluster?: SolanaCluster): string {
  return DEVNET_RPC_FIXED;
}
