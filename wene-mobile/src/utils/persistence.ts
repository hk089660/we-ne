import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClaimedRecord {
  status: 'claimed';
  claimedAt: number; // unix timestamp (seconds)
  campaignId: string;
  walletPubkey?: string;
}

/**
 * 受給状態の保存キーを生成
 */
export const getClaimedKey = (campaignId: string, walletPubkey?: string | null): string => {
  return `claimed:${campaignId}:${walletPubkey || 'anonymous'}`;
};

/**
 * 受給状態を保存
 */
export const saveClaimed = async (
  campaignId: string,
  walletPubkey?: string | null
): Promise<void> => {
  const key = getClaimedKey(campaignId, walletPubkey);
  const record: ClaimedRecord = {
    status: 'claimed',
    claimedAt: Math.floor(Date.now() / 1000),
    campaignId,
    walletPubkey: walletPubkey || undefined,
  };
  await AsyncStorage.setItem(key, JSON.stringify(record));
};

/**
 * 受給状態を読み込み
 */
export const loadClaimed = async (
  campaignId: string,
  walletPubkey?: string | null
): Promise<ClaimedRecord | null> => {
  const key = getClaimedKey(campaignId, walletPubkey);
  const value = await AsyncStorage.getItem(key);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as ClaimedRecord;
  } catch {
    return null;
  }
};

/**
 * 匿名キーからウォレットキーへの移行
 * 既に匿名で保存されている場合、ウォレットキーでも保存する
 */
export const migrateToWalletKey = async (
  campaignId: string,
  walletPubkey: string
): Promise<void> => {
  const anonymousKey = getClaimedKey(campaignId, null);
  const anonymousValue = await AsyncStorage.getItem(anonymousKey);
  
  if (anonymousValue) {
    // 匿名キーのデータをウォレットキーにも保存
    const record: ClaimedRecord = JSON.parse(anonymousValue);
    record.walletPubkey = walletPubkey;
    const walletKey = getClaimedKey(campaignId, walletPubkey);
    await AsyncStorage.setItem(walletKey, JSON.stringify(record));
  }
};

// ===== 使用済み永続化 =====

export interface UsedRecord {
  status: 'used';
  usedAt: number; // unix timestamp (seconds)
  campaignId: string;
  walletPubkey?: string;
  txSig: string; // 使用トランザクションの署名
  amount?: number; // 使用量（オプション）
}

/**
 * 使用済み状態の保存キーを生成
 */
export const getUsedKey = (campaignId: string, walletPubkey?: string | null): string => {
  return `used:${campaignId}:${walletPubkey || 'anonymous'}`;
};

/**
 * 使用済み状態を保存
 */
export const saveUsed = async (
  campaignId: string,
  walletPubkey: string | null,
  txSig: string,
  amount?: number
): Promise<void> => {
  const key = getUsedKey(campaignId, walletPubkey);
  const record: UsedRecord = {
    status: 'used',
    usedAt: Math.floor(Date.now() / 1000),
    campaignId,
    walletPubkey: walletPubkey || undefined,
    txSig,
    amount,
  };
  await AsyncStorage.setItem(key, JSON.stringify(record));
};

/**
 * 使用済み状態を読み込み
 */
export const loadUsed = async (
  campaignId: string,
  walletPubkey?: string | null
): Promise<UsedRecord | null> => {
  const key = getUsedKey(campaignId, walletPubkey);
  const value = await AsyncStorage.getItem(key);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as UsedRecord;
  } catch {
    return null;
  }
};
