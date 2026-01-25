import type { Grant } from '../types/grant';
import { grantsByCampaignId } from '../data/grants';

/**
 * campaignId から Grant を取得する API
 * 現状はローカルマップを参照。将来はサーバ API に差し替え可能
 * 
 * @param campaignId キャンペーンID
 * @returns Grant オブジェクト、見つからない場合は null
 */
export async function getGrantByCampaignId(campaignId: string): Promise<Grant | null> {
  const grant = grantsByCampaignId[campaignId];
  if (!grant) {
    return null;
  }
  return { ...grant };
}
