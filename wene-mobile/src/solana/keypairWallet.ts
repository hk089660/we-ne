/**
 * AnchorProvider に渡す Wallet 互換の実装
 *
 * 【RN × Anchor 問題】@coral-xyz/anchor の Wallet は isBrowser 判定により
 * RN で undefined になり "Cannot read property 'prototype' of undefined" が発生。
 * anchor の Wallet は一切 import せず、Keypair から自前実装する。
 * → Android 実機で claim フローがクラッシュせず動作する。
 */

import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';

/**
 * AnchorProvider が要求する Wallet インターフェース
 * （anchor の Wallet 型に合わせた最小限の型）
 */
export interface AnchorWalletLike {
  readonly publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]>;
}

/**
 * Keypair を Anchor Wallet 互換オブジェクトにラップする
 * tx.partialSign(keypair) または tx.sign([keypair]) で署名
 */
export class KeypairWallet implements AnchorWalletLike {
  constructor(readonly payer: Keypair) {}

  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T
  ): Promise<T> {
    if (!tx || typeof tx !== 'object') {
      throw new Error('KeypairWallet.signTransaction: invalid tx');
    }
    // VersionedTransaction: sign(signers: Signer[]) が存在する場合
    const vtx = tx as VersionedTransaction;
    if (typeof vtx.sign === 'function') {
      vtx.sign([this.payer]);
      return tx;
    }
    // legacy Transaction: partialSign(...signers)
    const ltx = tx as Transaction;
    if (typeof ltx.partialSign === 'function') {
      ltx.partialSign(this.payer);
      return tx;
    }
    throw new Error('KeypairWallet.signTransaction: tx has no sign/partialSign');
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    return Promise.all(txs.map((t) => this.signTransaction(t)));
  }
}
