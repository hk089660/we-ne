import { Transaction, Keypair, PublicKey } from '@solana/web3.js';
import { Platform } from 'react-native';
import type { WalletAdapter, WalletConnectResult } from './WalletAdapter';

/**
 * Mock Wallet Adapter
 * iOS Simulator等、実機がない環境で使用
 */
export class MockWalletAdapter implements WalletAdapter {
  readonly name = 'Mock Wallet';
  private _isConnected = false;
  private _publicKey: string | null = null;
  private _keypair: Keypair | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  async connect(): Promise<WalletConnectResult> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MockWalletAdapter.ts:25',message:'MockWalletAdapter.connect called',data:{platform:Platform.OS,hasKeypair:this._keypair!==null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    // 新しいキーペアを生成（または固定値を使用）
    if (!this._keypair) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MockWalletAdapter.ts:30',message:'calling Keypair.generate',data:{platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        this._keypair = Keypair.generate();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MockWalletAdapter.ts:33',message:'Keypair.generate success',data:{publicKey:this._keypair.publicKey.toBase58().substring(0,8)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MockWalletAdapter.ts:37',message:'Keypair.generate error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        throw error;
      }
    }
    
    this._publicKey = this._keypair.publicKey.toBase58();
    this._isConnected = true;

    // シミュレーション用の遅延
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      publicKey: this._publicKey,
      session: 'mock-session-' + Date.now(),
    };
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    this._publicKey = null;
    // keypairは保持（再接続時に同じキーを使用）
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    if (!this._keypair || !this._publicKey) {
      throw new Error('Wallet is not connected');
    }

    // トランザクションに署名
    tx.sign(this._keypair);
    
    // シミュレーション用の遅延
    await new Promise(resolve => setTimeout(resolve, 300));

    return tx;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._keypair) {
      throw new Error('Wallet is not connected');
    }

    // メッセージ署名（簡易実装）
    // 実際の実装ではnacl.sign等を使用
    const signature = this._keypair.secretKey.slice(0, 32);
    return signature;
  }
}
