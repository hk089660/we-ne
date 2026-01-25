import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as nacl from 'tweetnacl';

// Base64エンコード（React Native用）
const base64Encode = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

interface PhantomStore {
  // 暗号化キーペア
  encryptionKeyPair: nacl.BoxKeyPair | null;
  dappEncryptionPublicKey: string | null;
  dappSecretKey: Uint8Array | null;
  /** Connect リダイレクトで得た Phantom 側の暗号化公開鍵（signTransaction で使用） */
  phantomEncryptionPublicKey: string | null;

  // アクション
  initializeKeyPair: () => nacl.BoxKeyPair;
  getOrCreateKeyPair: () => nacl.BoxKeyPair;
  saveKeyPair: (keyPair: nacl.BoxKeyPair) => Promise<void>;
  loadKeyPair: () => Promise<nacl.BoxKeyPair | null>;
  setPhantomEncryptionPublicKey: (pk: string | null) => void;
}

const STORAGE_KEY = 'phantom_encryption_keypair';

export const usePhantomStore = create<PhantomStore>((set, get) => ({
  encryptionKeyPair: null,
  dappEncryptionPublicKey: null,
  dappSecretKey: null,
  phantomEncryptionPublicKey: null,
  
  initializeKeyPair: () => {
    const keyPair = nacl.box.keyPair();
    set({
      encryptionKeyPair: keyPair,
      dappEncryptionPublicKey: base64Encode(keyPair.publicKey),
      dappSecretKey: keyPair.secretKey,
    });
    return keyPair;
  },
  
  getOrCreateKeyPair: () => {
    const { encryptionKeyPair } = get();
    if (encryptionKeyPair) {
      return encryptionKeyPair;
    }
    return get().initializeKeyPair();
  },
  
  saveKeyPair: async (keyPair) => {
    const data = {
      publicKey: Array.from(keyPair.publicKey),
      secretKey: Array.from(keyPair.secretKey),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({
      encryptionKeyPair: keyPair,
      dappEncryptionPublicKey: base64Encode(keyPair.publicKey),
      dappSecretKey: keyPair.secretKey,
    });
  },
  
  loadKeyPair: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      const data = JSON.parse(stored);
      const keyPair: nacl.BoxKeyPair = {
        publicKey: Uint8Array.from(data.publicKey),
        secretKey: Uint8Array.from(data.secretKey),
      };
      set({
        encryptionKeyPair: keyPair,
        dappEncryptionPublicKey: base64Encode(keyPair.publicKey),
        dappSecretKey: keyPair.secretKey,
      });
      return keyPair;
    } catch {
      return null;
    }
  },

  setPhantomEncryptionPublicKey: (pk) => set({ phantomEncryptionPublicKey: pk }),
}));
