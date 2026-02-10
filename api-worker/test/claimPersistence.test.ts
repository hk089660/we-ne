/**
 * 仕様固定: 同一 subject で2回 POST しても claimedCount が増えない
 * 異なる subject なら増える。joinToken も同様。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClaimStore, type IClaimStorage } from '../src/claimLogic';

class InMemoryStorage implements IClaimStorage {
  private map = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.map.get(key);
  }

  async put(key: string, value: unknown): Promise<void> {
    this.map.set(key, value);
  }

  async list(prefix: string): Promise<Map<string, unknown>> {
    const out = new Map<string, unknown>();
    for (const [k, v] of this.map) {
      if (k.startsWith(prefix)) out.set(k, v);
    }
    return out;
  }
}

describe('claim persistence (same subject = no count increase)', () => {
  let store: ClaimStore;
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
    store = new ClaimStore(storage);
  });

  it('same subject twice: alreadyJoined=true, claimedCount stays 1', async () => {
    const r1 = await store.submitClaim({ eventId: 'evt-001', walletAddress: 'addr1' });
    expect(r1.success).toBe(true);
    expect((r1 as { alreadyJoined?: boolean }).alreadyJoined).toBe(false);

    let event = await store.getEvent('evt-001');
    expect(event?.claimedCount).toBe(1);

    const r2 = await store.submitClaim({ eventId: 'evt-001', walletAddress: ' addr1 ' });
    expect(r2.success).toBe(true);
    expect((r2 as { alreadyJoined?: boolean }).alreadyJoined).toBe(true);

    event = await store.getEvent('evt-001');
    expect(event?.claimedCount).toBe(1);
  });

  it('different subject: claimedCount increases', async () => {
    await store.submitClaim({ eventId: 'evt-001', walletAddress: 'addr1' });
    let event = await store.getEvent('evt-001');
    expect(event?.claimedCount).toBe(1);

    await store.submitClaim({ eventId: 'evt-001', walletAddress: 'addr2' });
    event = await store.getEvent('evt-001');
    expect(event?.claimedCount).toBe(2);
  });

  it('joinToken: same subject twice = already, claimedCount 1', async () => {
    const r1 = await store.submitClaim({ eventId: 'evt-002', joinToken: 'jt1' });
    expect(r1.success).toBe(true);
    expect((r1 as { alreadyJoined?: boolean }).alreadyJoined).toBe(false);

    let event = await store.getEvent('evt-002');
    expect(event?.claimedCount).toBe(1);

    const r2 = await store.submitClaim({ eventId: 'evt-002', joinToken: 'jt1' });
    expect(r2.success).toBe(true);
    expect((r2 as { alreadyJoined?: boolean }).alreadyJoined).toBe(true);

    event = await store.getEvent('evt-002');
    expect(event?.claimedCount).toBe(1);
  });
});
