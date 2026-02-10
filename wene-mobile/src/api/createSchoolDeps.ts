/**
 * 依存注入ファクトリ
 * EXPO_PUBLIC_API_MODE=mock|http で切り替え。screens/hooks は deps 経由のみ使用する。
 */

import type { SchoolClaimClient, SchoolEventProvider } from './schoolClaimClient';
import { createMockSchoolClaimClient } from './schoolClaimClient.mock';
import { mockSchoolEventProvider } from './schoolEvents';
import { createHttpSchoolEventProvider } from './http/HttpSchoolEventProvider';
import { createHttpSchoolClaimClient } from './http/HttpSchoolClaimClient';

export interface SchoolDeps {
  eventProvider: SchoolEventProvider;
  claimClient: SchoolClaimClient;
}

let cached: SchoolDeps | null = null;

export function createSchoolDeps(): SchoolDeps {
  const mode = (process.env.EXPO_PUBLIC_API_MODE ?? 'mock').toLowerCase();
  const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

  if (mode === 'http' && baseUrl) {
    return {
      eventProvider: createHttpSchoolEventProvider({ baseUrl }),
      claimClient: createHttpSchoolClaimClient({ baseUrl }),
    };
  }

  return {
    eventProvider: mockSchoolEventProvider,
    claimClient: createMockSchoolClaimClient(mockSchoolEventProvider),
  };
}

export function getSchoolDeps(): SchoolDeps {
  if (!cached) cached = createSchoolDeps();
  return cached;
}

export function resetSchoolDeps(): void {
  cached = null;
}
