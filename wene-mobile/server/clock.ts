/**
 * 時刻注入用（テストで固定可能）
 */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};
