/**
 * 利用者登録・参加申込 API（userId + PIN フロー）
 * 同一 baseUrl（EXPO_PUBLIC_API_BASE_URL）を使用
 */

import { httpPost } from './http/httpClient';

export function getBaseUrl(): string {
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (base) return base;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export interface RegisterResponse {
  userId: string;
}

export interface UserClaimResponse {
  status: 'created' | 'already';
  confirmationCode: string;
}

export async function registerUser(displayName: string, pin: string): Promise<RegisterResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/users/register`;
  return httpPost<RegisterResponse>(url, { displayName, pin });
}

export async function claimEventWithUser(
  eventId: string,
  userId: string,
  pin: string
): Promise<UserClaimResponse> {
  const base = getBaseUrl();
  const url = `${base}/api/events/${encodeURIComponent(eventId)}/claim`;
  return httpPost<UserClaimResponse>(url, { userId, pin });
}
