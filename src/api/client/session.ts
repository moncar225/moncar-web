export interface StoredSession {
  token: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
}

export const SESSION_STORAGE_KEY = 'moncar:session' as const;

export interface SessionStorage {
  load(): StoredSession | null;
  save(session: StoredSession): void;
  clear(): void;
}

class LocalSessionStorage implements SessionStorage {
  load(): StoredSession | null {
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'token' in parsed &&
        typeof (parsed as { token?: unknown }).token === 'string' &&
        'expiresAt' in parsed &&
        typeof (parsed as { expiresAt?: unknown }).expiresAt === 'number' &&
        'userId' in parsed &&
        typeof (parsed as { userId?: unknown }).userId === 'string'
      ) {
        const refreshToken = (parsed as { refreshToken?: unknown }).refreshToken;
        return {
          token: (parsed as { token: string }).token,
          refreshToken:
            typeof refreshToken === 'string' ? refreshToken : undefined,
          expiresAt: (parsed as { expiresAt: number }).expiresAt,
          userId: (parsed as { userId: string }).userId,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  save(session: StoredSession): void {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
  }

  clear(): void {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export const defaultSessionStorage: SessionStorage =
  typeof window === 'undefined'
    ? {
        load: () => null,
        save: () => {},
        clear: () => {},
      }
    : new LocalSessionStorage();

export class SessionManager {
  private readonly storage: SessionStorage;
  private listeners = new Set<(session: StoredSession | null) => void>();
  private current: StoredSession | null;

  constructor(storage: SessionStorage = defaultSessionStorage) {
    this.storage = storage;
    this.current = storage.load();
  }

  get(): StoredSession | null {
    return this.current;
  }

  get token(): string | null {
    return this.current?.token ?? null;
  }

  isExpired(now: number = Date.now()): boolean {
    return this.current === null ? true : this.current.expiresAt <= now;
  }

  set(session: StoredSession): void {
    this.storage.save(session);
    this.current = session;
    this.emit();
  }

  clear(): void {
    this.storage.clear();
    this.current = null;
    this.emit();
  }

  onChange(listener: (session: StoredSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.current);
    }
  }
}

export type RefreshTokenFn = (refreshToken: string) => Promise<StoredSession>;

export async function tryRefresh(
  sessionManager: SessionManager,
  refreshFn: RefreshTokenFn,
): Promise<StoredSession | null> {
  const current = sessionManager.get();
  if (current === null || current.refreshToken === undefined) return null;
  try {
    const refreshed = await refreshFn(current.refreshToken);
    sessionManager.set(refreshed);
    return refreshed;
  } catch {
    sessionManager.clear();
    return null;
  }
}
