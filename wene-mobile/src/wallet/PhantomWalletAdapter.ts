import { Transaction } from '@solana/web3.js';
import type { WalletAdapter, WalletConnectResult } from './WalletAdapter';
import { signTransaction as phantomSignTransaction } from '../utils/phantom';

/**
 * Phantom Wallet Adapter
 * 実機でPhantomアプリを使用する場合
 * 
 * 注意: connect()は実際にはapp/phantom/[action].tsxで処理されるため、
 * このクラスは主にsignTransaction用のラッパーとして使用
 */
export class PhantomWalletAdapter implements WalletAdapter {
  readonly name = 'Phantom';
  private _publicKey: string | null = null;
  private _session: string | null = null;
  private _phantomEncryptionPublicKey: string | null = null;
  private _dappEncryptionPublicKey: string | null = null;
  private _dappSecretKey: Uint8Array | null = null;

  get isConnected(): boolean {
    return this._publicKey !== null;
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  /**
   * 接続情報を設定（app/phantom/[action].tsxから呼ばれる）
   */
  setConnectionInfo(
    publicKey: string,
    session: string,
    phantomEncryptionPublicKey: string,
    dappEncryptionPublicKey: string,
    dappSecretKey: Uint8Array
  ): void {
    this._publicKey = publicKey;
    this._session = session;
    this._phantomEncryptionPublicKey = phantomEncryptionPublicKey;
    this._dappEncryptionPublicKey = dappEncryptionPublicKey;
    this._dappSecretKey = dappSecretKey;
  }

  async connect(): Promise<WalletConnectResult> {
    // Phantom Connectは実際にはapp/phantom/[action].tsxで処理される
    // 実際の接続は initiatePhantomConnect() を使用し、
    // リダイレクト後に setConnectionInfo() で接続情報を設定する
    throw new Error('Phantom connect requires redirect handling. Use initiatePhantomConnect() and handle redirect in app/phantom/[action] route.');
  }

  async disconnect(): Promise<void> {
    this._publicKey = null;
    this._session = null;
    this._phantomEncryptionPublicKey = null;
    this._dappEncryptionPublicKey = null;
    this._dappSecretKey = null;
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    if (!this._publicKey || !this._session || !this._phantomEncryptionPublicKey) {
      throw new Error('Wallet is not connected');
    }

    if (!this._dappEncryptionPublicKey || !this._dappSecretKey) {
      throw new Error('Phantom encryption keys not initialized');
    }

    return await phantomSignTransaction({
      tx,
      session: this._session,
      dappEncryptionPublicKey: this._dappEncryptionPublicKey,
      dappSecretKey: this._dappSecretKey,
      phantomEncryptionPublicKey: this._phantomEncryptionPublicKey,
      redirectLink: 'wene://phantom/signTransaction',
      cluster: 'devnet',
      appUrl: 'https://wene.app',
    });
  }
}
