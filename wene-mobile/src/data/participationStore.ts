import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParticipationState } from '../types/ui';

export interface ParticipationRecord {
  eventId: string;
  state: Extract<ParticipationState, 'started' | 'completed'>;
  startedAt: number;
  completedAt?: number;
}

const STORAGE_KEY = 'wene:participations';

const loadRecords = async (): Promise<ParticipationRecord[]> => {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as ParticipationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRecords = async (records: ParticipationRecord[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const getParticipations = async (): Promise<ParticipationRecord[]> => {
  return loadRecords();
};

export const setStarted = async (eventId: string): Promise<void> => {
  const records = await loadRecords();
  const existing = records.find((record) => record.eventId === eventId);
  if (existing) {
    if (existing.state === 'completed') return;
    await saveRecords(records);
    return;
  }
  const now = Date.now();
  records.push({ eventId, state: 'started', startedAt: now });
  await saveRecords(records);
};

export const setCompleted = async (eventId: string): Promise<void> => {
  const records = await loadRecords();
  const existing = records.find((record) => record.eventId === eventId);
  const now = Date.now();
  if (existing) {
    existing.state = 'completed';
    existing.completedAt = now;
    if (!existing.startedAt) {
      existing.startedAt = now;
    }
    await saveRecords(records);
    return;
  }
  records.push({ eventId, state: 'completed', startedAt: now, completedAt: now });
  await saveRecords(records);
};
