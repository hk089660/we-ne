import * as nacl from 'tweetnacl';
import { Linking, Platform, ToastAndroid } from 'react-native';
import { Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import * as LinkingExpo from 'expo-linking';
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
 * dapp_encryption_public_keyはBase58エンコードで送信
 */
export const buildPhantomConnectUrl = (params: PhantomConnectParams): string => {
  const { dappEncryptionPublicKey, redirectLink, cluster = 'devnet', appUrl } = params;
  
  // Base64 → Base58変換
  let dappKeyBase58: string;
  try {
    const decoded = base64Decode(dappEncryptionPublicKey);
    dappKeyBase58 = bs58.encode(decoded);
    console.log('[buildPhantomConnectUrl] dapp_encryption_public_key converted to base58, length:', dappKeyBase58.length);
  } catch (e) {
    console.warn('[buildPhantomConnectUrl] Failed to convert to base58, using as-is');
    dappKeyBase58 = dappEncryptionPublicKey;
  }
  
  const url = new URL('https://phantom.app/ul/v1/connect');
  url.searchParams.set('app_url', appUrl);
  url.searchParams.set('dapp_encryption_public_key', dappKeyBase58);
  url.searchParams.set('redirect_link', redirectLink);
  url.searchParams.set('cluster', cluster);
  
  return url.toString();
};

/**
 * PhantomからのリダイレクトURLを解析
 */
export const parsePhantomRedirect = (url: string): { data: string; nonce: string } | null => {
  try {
    const parsed = LinkingExpo.parse(url);
    const qp = parsed.queryParams ?? {};
    const data = qp.data;
    const nonce = qp.nonce;
    
    if (!data || typeof data !== 'string' || !nonce || typeof nonce !== 'string') {
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
    // Base58デコード
    const encrypted = bs58.decode(encryptedData);
    const nonceBytes = bs58.decode(nonce);
    const phantomPubkeyBytes = bs58.decode(phantomPublicKey);
    
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
  
  await openPhantomConnect(url);
};

/**
 * Phantom Connectリダイレクト処理
 */
export const handlePhantomConnectRedirect = (
  url: string,
  dappSecretKey: Uint8Array
): { ok: true; result: PhantomConnectResult; phantomPublicKey: string } | { ok: false; error: string; stage: string } => {
  try {
    console.log('[handlePhantomConnectRedirect] stage=start, url:', url);
    
    // URLパース
    const urlParsed = LinkingExpo.parse(url);
    const qp = urlParsed.queryParams ?? {};
    
    // エラーチェック
    if (qp.errorCode || qp.errorMessage) {
      return { ok: false, error: `${qp.errorCode}: ${qp.errorMessage}`, stage: 'error_response' };
    }
    
    const data = qp.data as string;
    const nonce = qp.nonce as string;
    const phantomPublicKey = qp.phantom_encryption_public_key as string;
    
    if (!data || !nonce || !phantomPublicKey) {
      return { ok: false, error: 'Missing required params', stage: 'check_params' };
    }
    
    console.log('[handlePhantomConnectRedirect] stage=check_keys, keys_ok, dappSecretKey length:', dappSecretKey.length);
    
    // 復号
    const encrypted = bs58.decode(data);
    const nonceBytes = bs58.decode(nonce);
    const phantomPubkeyBytes = bs58.decode(phantomPublicKey);
    
    console.log('[handlePhantomConnectRedirect] stage=decrypt, decode_ok');
    
    const decrypted = nacl.box.open(encrypted, nonceBytes, phantomPubkeyBytes, dappSecretKey);
    
    if (!decrypted) {
      return { ok: false, error: 'Decryption failed', stage: 'decrypt' };
    }
    
    console.log('[handlePhantomConnectRedirect] stage=decrypt, decrypt_ok, decrypted length:', decrypted.length);
    
    // JSONパース
    const jsonString = new TextDecoder().decode(decrypted);
    const result = JSON.parse(jsonString);
    
    console.log('[handlePhantomConnectRedirect] stage=json_parse, success, keys:', Object.keys(result));
    
    return {
      ok: true,
      result: {
        publicKey: result.public_key,
        session: result.session,
      },
      phantomPublicKey,
    };
  } catch (e) {
    const errorMsg = (e as Error)?.message ?? String(e);
    console.error('[handlePhantomConnectRedirect] error:', errorMsg);
    return { ok: false, error: errorMsg, stage: 'exception' };
  }
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

  // Base64 → Base58変換
  let dappKeyBase58: string;
  try {
    const decoded = base64Decode(dappEncryptionPublicKey);
    dappKeyBase58 = bs58.encode(decoded);
  } catch {
    dappKeyBase58 = dappEncryptionPublicKey;
  }

  const nonce = nacl.randomBytes(24);
  const phantomPk = bs58.decode(phantomEncryptionPublicKey);

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
  url.searchParams.set('dapp_encryption_public_key', dappKeyBase58);
  url.searchParams.set('nonce', bs58.encode(nonce));
  url.searchParams.set('redirect_link', redirectLink);
  url.searchParams.set('payload', bs58.encode(encrypted));
  url.searchParams.set('app_url', appUrl);
  url.searchParams.set('cluster', cluster);

  return url.toString();
};

/**
 * Phantom signTransaction リダイレクトの復号
 */
export const decryptPhantomSignTransactionResponse = (
  encryptedData: string,
  nonce: string,
  dappSecretKey: Uint8Array,
  phantomPublicKey: string
): Transaction | null => {
  try {
    const encrypted = bs58.decode(encryptedData);
    const nonceBytes = bs58.decode(nonce);
    const phantomPk = bs58.decode(phantomPublicKey);

    const decrypted = nacl.box.open(encrypted, nonceBytes, phantomPk, dappSecretKey);
    if (!decrypted) {
      return null;
    }

    const result = JSON.parse(new TextDecoder().decode(decrypted));
    const signedB64 = result.transaction ?? result.signed_transaction ?? result.signedTransaction;
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
 */
export const signTransaction = async (
  params: PhantomSignTransactionParams
): Promise<Transaction> => {
  const url = buildPhantomSignTransactionUrl(params);

  return new Promise<Transaction>((resolve, reject) => {
    setPendingSignTx(resolve, reject);

    openPhantomConnect(url)
      .then(() => {})
      .catch((err) => {
        rejectPendingSignTx(err instanceof Error ? err : new Error(String(err)));
      });
  });
};

/**
 * signTransaction リダイレクト処理
 */
export const handleRedirect = (
  url: string,
  dappSecretKey: Uint8Array
): { ok: true; tx: Transaction } | { ok: false; error: string } => {
  const urlParsed = LinkingExpo.parse(url);
  const qp = urlParsed.queryParams ?? {};
  
  const data = qp.data as string;
  const nonce = qp.nonce as string;
  const phantomPublicKey = qp.phantom_encryption_public_key as string;
  
  if (!data || !nonce) {
    return { ok: false, error: 'Invalid redirect URL' };
  }

  if (!phantomPublicKey) {
    return { ok: false, error: 'Phantom public key not found' };
  }

  const tx = decryptPhantomSignTransactionResponse(
    data,
    nonce,
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
