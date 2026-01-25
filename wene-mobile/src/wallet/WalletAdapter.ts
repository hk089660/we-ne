import { Transaction, PublicKey } from '@solana/web3.js';

/**
 * Wallet接続結果
 */
export interface WalletConnectResult {
  publicKey: string;
  session?: string; // Phantom等でセッションが必要な場合
}

/**
 * Wallet Adapter インターフェース
 * Phantom実装とMock実装で共通のインターフェース
 */
export interface WalletAdapter {
  /**
   * ウォレット名
   */
  readonly name: string;

  /**
   * 接続済みかどうか
   */
  readonly isConnected: boolean;

  /**
   * 公開鍵（接続済みの場合）
   */
  readonly publicKey: string | null;

  /**
   * 接続を開始
   * @returns 接続結果（publicKey, session等）
   */
  connect(): Promise<WalletConnectResult>;

  /**
   * 切断
   */
  disconnect(): Promise<void>;

  /**
   * トランザクションに署名
   * @param tx 署名するトランザクション
   * @returns 署名済みトランザクション
   */
  signTransaction(tx: Transaction): Promise<Transaction>;

  /**
   * メッセージに署名（オプション）
   * @param message 署名するメッセージ
   * @returns 署名
   */
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
}
