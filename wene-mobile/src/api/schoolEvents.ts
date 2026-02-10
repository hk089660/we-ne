/**
 * 学校向けイベント取得 API - Mock 実装
 *
 * 通常は createSchoolDeps() の eventProvider を利用すること。
 * このモックは mock モード用。
 */

import { mockEvents } from '../data/adminMock';
import type { SchoolEvent } from '../types/school';
import type { SchoolEventProvider } from './schoolClaimClient';

export type { SchoolEvent } from '../types/school';

const toSchoolEvent = (e: (typeof mockEvents)[0]): SchoolEvent => ({
  id: e.id,
  title: e.title,
  datetime: e.datetime,
  host: e.host,
  state: e.state,
});

export const mockSchoolEventProvider: SchoolEventProvider = {
  async getById(eventId: string): Promise<SchoolEvent | null> {
    const event = mockEvents.find((e) => e.id === eventId);
    return event ? toSchoolEvent(event) : null;
  },
  async getAll(): Promise<SchoolEvent[]> {
    return mockEvents.map(toSchoolEvent);
  },
};
