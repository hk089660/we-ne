/**
 * GET /v1/school/events と GET /v1/school/events/:id で取得
 */

import { httpGet } from './httpClient';
import type { SchoolEvent } from '../../types/school';
import type { SchoolEventProvider } from '../schoolClaimClient';

export interface HttpSchoolEventProviderOptions {
  baseUrl: string;
}

export function createHttpSchoolEventProvider(options: HttpSchoolEventProviderOptions): SchoolEventProvider {
  const base = options.baseUrl.replace(/\/$/, '');
  const prefix = `${base}/v1/school`;

  return {
    async getById(eventId: string): Promise<SchoolEvent | null> {
      try {
        const event = await httpGet<SchoolEvent>(`${prefix}/events/${encodeURIComponent(eventId)}`);
        return event && typeof event.id === 'string' ? event : null;
      } catch {
        return null;
      }
    },
    async getAll(): Promise<SchoolEvent[]> {
      try {
        const res = await httpGet<{ items: SchoolEvent[]; nextCursor?: string }>(`${prefix}/events`);
        return Array.isArray(res?.items) ? res.items : [];
      } catch {
        return [];
      }
    },
  };
}
