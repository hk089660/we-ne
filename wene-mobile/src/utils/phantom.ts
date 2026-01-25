import * as nacl from 'tweetnacl';
import { Linking } from 'react-native';
import { Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { setPendingSignTx, resolvePendingSignTx, rejectPendingSignTx } from './phantomSignTxPending';
import { openPhantomConnect } from '../wallet/openPhantom';

export interface PhantomConnectParams {
  dappEncryptionPublicKey: string;
  redirectLink: string;
  cluster?: 'devnet' | 'mainnet-beta';
  appUrl: string;
}

export interface PhantomConnectResult {
  publicKey: string;
  session: string;
}

/**
 * Base64エンコード（React Native用）
 */
const base64Encode = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

/**
 * Base64デコード（React Native用）
 */
const base64Decode = (str: string): Uint8Array => {
  const binary = atob(str);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

/**
 * Phantom Connect用の暗号化キーペアを生成
 */
export const generateEncryptionKeyPair = (): nacl.BoxKeyPair => {
  return nacl.box.keyPair();
}

/**
 * Phantom Connect URLを生成
 */
export const buildPhantomConnectUrl = (params: PhantomConnectParams): string => {
  const { dappEncryptionPublicKey, redirectLink, cluster = 'devnet', appUrl } = params;
  
  const url = new URL('https://phantom.app/ul/v1/connect');
  url.searchParams.set('app_url', appUrl);
  url.searchParams.set('dapp_encryption_public_key', dappEncryptionPublicKey);
  url.searchParams.set('redirect_link', redirectLink);
  url.searchParams.set('cluster', cluster);
  
  return url.toString();
};

/**
 * PhantomからのリダイレクトURLを解析
 * 形式: wene://phantom/connect?data=...&nonce=...
 */
export const parsePhantomRedirect = (url: string): { data: string; nonce: string } | null => {
  try {
    const parsed = new URL(url);
    const data = parsed.searchParams.get('data');
    const nonce = parsed.searchParams.get('nonce');
    
    if (!data || !nonce) {
      return null;
    }
    
    return { data, nonce };
  } catch {
    return null;
  }
};

/**
 * Phantomからの暗号化データを復号
 */
export const decryptPhantomResponse = (
  encryptedData: string,
  nonce: string,
  dappSecretKey: Uint8Array,
  phantomPublicKey: string
): PhantomConnectResult | null => {
  try {
    // Base64デコード
    const encrypted = base64Decode(encryptedData);
    const nonceBytes = base64Decode(nonce);
    const phantomPubkeyBytes = base64Decode(phantomPublicKey);
    
    // 復号
    const decrypted = nacl.box.open(encrypted, nonceBytes, phantomPubkeyBytes, dappSecretKey);
    
    if (!decrypted) {
      return null;
    }
    
    // JSONパース
    const result = JSON.parse(new TextDecoder().decode(decrypted));
    
    return {
      publicKey: result.public_key || result.publicKey,
      session: result.session,
    };
  } catch (error) {
    console.error('Failed to decrypt Phantom response:', error);
    return null;
  }
};

/**
 * Phantom Connectを開始
 */
export const initiatePhantomConnect = async (
  dappEncryptionPublicKey: string,
  dappSecretKey: Uint8Array,
  redirectLink: string = 'wene://phantom/connect',
  cluster: 'devnet' | 'mainnet-beta' = 'devnet',
  appUrl: string = 'https://wene.app'
): Promise<void> => {
  const url = buildPhantomConnectUrl({
    dappEncryptionPublicKey,
    redirectLink,
    cluster,
    appUrl,
  });
  
  // openPhantomConnectを使用（canOpenURL依存を排除）
  await openPhantomConnect(url);
};

// --- signTransaction ---

export interface PhantomSignTransactionParams {
  tx: Transaction;
  session: string;
  dappEncryptionPublicKey: string;
  dappSecretKey: Uint8Array;
  phantomEncryptionPublicKey: string;
  redirectLink?: string;
  cluster?: 'devnet' | 'mainnet-beta';
  appUrl?: string;
}

/**
 * Phantom signTransaction URL を生成
 * payload: { transaction: base64, session } を暗号化して base58
 */
export const buildPhantomSignTransactionUrl = (params: PhantomSignTransactionParams): string => {
  const {
    tx,
    session,
    dappEncryptionPublicKey,
    dappSecretKey,
    phantomEncryptionPublicKey,
    redirectLink = 'wene://phantom/signTransaction',
    cluster = 'devnet',
    appUrl = 'https://wene.app',
  } = params;

  const nonce = nacl.randomBytes(24);
  const phantomPk = base64Decode(phantomEncryptionPublicKey);

  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const transactionBase64 = base64Encode(new Uint8Array(serialized));
  const payloadJson = JSON.stringify({ transaction: transactionBase64, session });
  const payloadBytes = new TextEncoder().encode(payloadJson);

  const encrypted = nacl.box(
    payloadBytes,
    nonce,
    phantomPk,
    dappSecretKey
  );

  if (!encrypted) {
    throw new Error('Failed to encrypt signTransaction payload');
  }

  const url = new URL('https://phantom.app/ul/v1/signTransaction');
  url.searchParams.set('dapp_encryption_public_key', dappEncryptionPublicKey);
  url.searchParams.set('nonce', bs58.encode(nonce));
  url.searchParams.set('redirect_link', redirectLink);
  url.searchParams.set('payload', bs58.encode(encrypted));
  url.searchParams.set('app_url', appUrl);
  url.searchParams.set('cluster', cluster);

  return url.toString();
};

/**
 * Phantom signTransaction リダイレクトの復号
 * 応答: { signed_transaction: base64 }
 */
export const decryptPhantomSignTransactionResponse = (
  encryptedData: string,
  nonce: string,
  dappSecretKey: Uint8Array,
  phantomPublicKey: string
): Transaction | null => {
  try {
    const encrypted = base64Decode(encryptedData);
    const nonceBytes = base64Decode(nonce);
    const phantomPk = base64Decode(phantomPublicKey);

    const decrypted = nacl.box.open(encrypted, nonceBytes, phantomPk, dappSecretKey);
    if (!decrypted) {
      return null;
    }

    const result = JSON.parse(new TextDecoder().decode(decrypted));
    const signedB64 = result.signed_transaction ?? result.signedTransaction;
    if (!signedB64) {
      return null;
    }

    const signedBuf = base64Decode(signedB64);
    return Transaction.from(signedBuf);
  } catch (error) {
    console.error('Failed to decrypt signTransaction response:', error);
    return null;
  }
};

/**
 * Phantom signTransaction を開始
 * リダイレクト待ちの Promise を返す。handleRedirect で resolve/reject される。
 */
export const signTransaction = async (
  params: PhantomSignTransactionParams
): Promise<Transaction> => {
  const url = buildPhantomSignTransactionUrl(params);

  return new Promise<Transaction>((resolve, reject) => {
    setPendingSignTx(resolve, reject);

    // openPhantomConnectを使用（canOpenURL依存を排除）
    openPhantomConnect(url)
      .then(() => {
        // 成功時は何もしない（リダイレクト待ち）
      })
      .catch((err) => {
        rejectPendingSignTx(err instanceof Error ? err : new Error(String(err)));
      });
  });
};

/**
 * signTransaction リダイレクト処理
 * URL を解析し、復号して signed Transaction を取得し、待機中 Promise を resolve/reject する。
 * action=signTransaction のときだけ呼ぶ。
 */
export const handleRedirect = (
  url: string,
  dappSecretKey: Uint8Array
): { ok: true; tx: Transaction } | { ok: false; error: string } => {
  const parsed = parsePhantomRedirect(url);
  if (!parsed) {
    return { ok: false, error: 'Invalid redirect URL' };
  }

  const urlObj = new URL(url);
  const phantomPublicKey = urlObj.searchParams.get('phantom_encryption_public_key');
  if (!phantomPublicKey) {
    return { ok: false, error: 'Phantom public key not found' };
  }

  const tx = decryptPhantomSignTransactionResponse(
    parsed.data,
    parsed.nonce,
    dappSecretKey,
    phantomPublicKey
  );

  if (!tx) {
    rejectPendingSignTx(new Error('Failed to decrypt signed transaction'));
    return { ok: false, error: 'Failed to decrypt signed transaction' };
  }

  resolvePendingSignTx(tx);
  return { ok: true, tx };
};
