import { describe, expect, it, beforeEach } from 'vitest';
import { SessionManager, type SessionStorage, type StoredSession } from '@/api/client/session';

class MemoryStorage implements SessionStorage {
  private data: StoredSession | null = null;
  loadCalls = 0;
  saveCalls = 0;
  clearCalls = 0;

  load(): StoredSession | null {
    this.loadCalls += 1;
    return this.data;
  }
  save(session: StoredSession): void {
    this.saveCalls += 1;
    this.data = session;
  }
  clear(): void {
    this.clearCalls += 1;
    this.data = null;
  }
}

const validSession: StoredSession = {
  token: 'token-valid',
  refreshToken: 'refresh-1',
  expiresAt: Date.now() + 60_000,
  userId: 'u-1',
};

describe('SessionManager', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('charge depuis storage, isExpired, set et clear propagent', () => {
    const mgr = new SessionManager(storage);
    expect(storage.loadCalls).toBe(1);
    expect(mgr.get()).toBeNull();
    expect(mgr.token).toBeNull();
    expect(mgr.isExpired()).toBe(true);

    mgr.set(validSession);
    expect(storage.saveCalls).toBe(1);
    expect(mgr.get()).toEqual(validSession);
    expect(mgr.token).toBe('token-valid');
    expect(mgr.isExpired()).toBe(false);

    mgr.clear();
    expect(storage.clearCalls).toBe(1);
    expect(mgr.get()).toBeNull();
    expect(mgr.isExpired()).toBe(true);
  });

  it('détecte une session expirée dans le passé', () => {
    const expired: StoredSession = { ...validSession, expiresAt: Date.now() - 1 };
    const mgr = new SessionManager(storage);
    mgr.set(expired);
    expect(mgr.isExpired()).toBe(true);
  });

  it('onChange notifie set puis clear', () => {
    const events: Array<StoredSession | null> = [];
    const mgr = new SessionManager(storage);
    const unsub = mgr.onChange((s) => {
      events.push(s);
    });

    mgr.set(validSession);
    mgr.clear();
    unsub();
    mgr.set(validSession);
    expect(events).toEqual([validSession, null]);
  });
});
