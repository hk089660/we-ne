import { create } from 'zustand';
import { loadClaimed, saveClaimed, migrateToWalletKey, loadUsed, saveUsed } from '../utils/persistence';

export type RecipientState =
  | 'Idle'
  | 'Connecting'
  | 'Connected'
  | 'Claiming'
  | 'Claimed'
  | 'Expired'
  | 'Error';

interface RecipientStore {
  // 状態
  state: RecipientState;
  
  // データ
  publicKey: string | null;
  walletPubkey: string | null; // Phantom接続後の公開鍵
  phantomSession: string | null; // Phantomセッション
  campaignId: string | null;
  code: string | null;
  lastError: string | null;
  isClaimed: boolean; // 受給済みかどうか
  lastSignature: string | null; // 直近の claim 署名（Claimed 時表示用）
  isUsed: boolean; // 使用済みかどうか
  lastUsedSignature: string | null; // 直近の use 署名（Used 時表示用）

  // アクション
  setState: (state: RecipientState) => void;
  setLastSignature: (sig: string | null) => void;
  setPublicKey: (publicKey: string | null) => void;
  setWalletPubkey: (walletPubkey: string | null) => void;
  setPhantomSession: (session: string | null) => void;
  setCampaign: (campaignId: string, code?: string) => void;
  setError: (error: string) => void;
  checkClaimed: (campaignId: string, walletPubkey?: string | null) => Promise<void>;
  markAsClaimed: (campaignId: string, walletPubkey?: string | null) => Promise<void>;
  checkUsed: (campaignId: string, walletPubkey?: string | null) => Promise<void>;
  markAsUsed: (campaignId: string, walletPubkey: string | null, txSig: string, amount?: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  state: 'Idle' as RecipientState,
  publicKey: null,
  walletPubkey: null,
  phantomSession: null,
  campaignId: null,
  code: null,
  lastError: null,
  isClaimed: false,
  lastSignature: null,
  isUsed: false,
  lastUsedSignature: null,
};

export const useRecipientStore = create<RecipientStore>((set, get) => ({
  ...initialState,
  
  setState: (state) => set({ state }),
  
  setPublicKey: (publicKey) => set({ publicKey }),
  
  setWalletPubkey: async (walletPubkey) => {
    set({ walletPubkey });
    // ウォレット接続時に匿名キーから移行
    const { campaignId } = get();
    if (campaignId && walletPubkey) {
      await migrateToWalletKey(campaignId, walletPubkey);
      // 移行後、受給状態を再チェック
      await get().checkClaimed(campaignId, walletPubkey);
    }
  },
  
  setPhantomSession: (session) => set({ phantomSession: session }),
  
  setCampaign: (campaignId, code) => set({ campaignId, code: code || null }),
  
  setError: (error) => set({ state: 'Error', lastError: error }),

  setLastSignature: (sig) => set({ lastSignature: sig }),

  checkClaimed: async (campaignId, walletPubkey) => {
    const claimed = await loadClaimed(campaignId, walletPubkey);
    if (claimed) {
      set({ state: 'Claimed', isClaimed: true });
    } else {
      set({ isClaimed: false });
    }
  },
  
  markAsClaimed: async (campaignId, walletPubkey) => {
    await saveClaimed(campaignId, walletPubkey);
    set({ state: 'Claimed', isClaimed: true });
  },

  checkUsed: async (campaignId, walletPubkey) => {
    const used = await loadUsed(campaignId, walletPubkey);
    if (used) {
      set({ isUsed: true, lastUsedSignature: used.txSig });
    } else {
      set({ isUsed: false, lastUsedSignature: null });
    }
  },

  markAsUsed: async (campaignId, walletPubkey, txSig, amount) => {
    await saveUsed(campaignId, walletPubkey, txSig, amount);
    set({ isUsed: true, lastUsedSignature: txSig });
  },
  
  reset: () => set(initialState),
}));
