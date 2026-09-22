import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import {
  HttpClient,
  type HttpClientConfig,
  HTTP_STATUS,
  IdempotencyManager,
  SessionManager,
  TimestampManager,
  type SessionStorage,
  type StoredSession,
  isApiError,
} from '@/api';
import type { ApiError } from '@/api';
import { getMockServer } from '@/api/mocks/node';

class MemoryStore implements SessionStorage {
  private data: StoredSession | null = null;
  load(): StoredSession | null { return this.data; }
  save(s: StoredSession): void { this.data = s; }
  clear(): void { this.data = null; }
}

function makeClient(base: string, overrides: Partial<HttpClientConfig> = {}) {
  return new HttpClient({
    baseUrl: base,
    session: new SessionManager(new MemoryStore()),
    idempotency: new IdempotencyManager({ generateKey: () => 'test-key' }),
    timestamp: new TimestampManager({ enabled: true, getNow: () => 1234 }),
    ...overrides,
  });
}

describe('HttpClient avec MSW (fixtures /errors/*)', () => {
  it('GET /health retourne la réponse mock sans lancer', async () => {
    const client = makeClient('https://api.test');
    const resp = await client.get<{ status: string; mock?: boolean }>('/health');
    expect(resp.status).toBe('ok');
    expect(resp.mock).toBe(true);
  });

  it('mappe chaque code HTTP en ApiError avec message français', async () => {
    const client = makeClient('https://api.test');

    const cases: Array<{ path: string; method?: 'GET' | 'POST'; expected: number; kind: string }> = [
      { path: '/fixtures/errors/401', expected: 401, kind: 'auth' },
      { path: '/fixtures/errors/403', expected: 403, kind: 'forbidden' },
      { path: '/fixtures/errors/429', expected: 429, kind: 'tooManyRequests' },
      { path: '/fixtures/errors/500', expected: 500, kind: 'server' },
      { path: '/fixtures/errors/422', method: 'POST', expected: 422, kind: 'validation' },
      { path: '/fixtures/errors/409', method: 'POST', expected: 409, kind: 'conflict' },
    ];

    for (const c of cases) {
      try {
        if (c.method === 'POST') {
          await client.post(c.path);
        } else {
          await client.get(c.path);
        }
        expect.unreachable(`Pas d'erreur pour ${c.path}`);
      } catch (err) {
        expect(isApiError(err), `${c.path} instanceof ApiError`).toBe(true);
        const e = err as ApiError;
        expect(e.statusCode, c.path).toBe(c.expected);
        expect(e.kind, c.path).toBe(c.kind as ApiError['kind']);
        expect(e.message.length).toBeGreaterThan(0);
      }
    }
  });

  it('extrait incidentId sur erreur 500 depuis header X-Request-Id', async () => {
    const client = makeClient('https://api.test');
    try {
      await client.get('/fixtures/errors/500');
      expect.unreachable();
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      const e = err as ApiError;
      expect(e.incidentId).toBe('REQ-MOCK-500-0001');
    }
  });

  it('ajoute Authorization, Idempotency-Key et X-Request-Timestamp sur POST', async () => {
    const server = getMockServer();
    const observed = new Map<string, string | null>();
    server.use(
      http.post('https://api.test/echo-headers', async ({ request }) => {
        observed.set('authorization', request.headers.get('authorization'));
        observed.set('idempotency', request.headers.get('idempotency-key'));
        observed.set('timestamp', request.headers.get('x-request-timestamp'));
        return HttpResponse.json({ ok: true });
      }),
    );

    const storage = new MemoryStore();
    storage.save({
      token: 'sess-token',
      expiresAt: Date.now() + 60_000,
      userId: 'u-1',
    });
    const client = makeClient('https://api.test', {
      session: new SessionManager(storage),
    });
    await client.post('/echo-headers');

    expect(observed.get('authorization')).toBe('Bearer sess-token');
    expect(observed.get('idempotency')).toBe('test-key');
    expect(observed.get('timestamp')).toBe('1234');
  });

  it('onUnauthorized est appelé sur 401 et la session est effacée', async () => {
    const storage = new MemoryStore();
    storage.save({
      token: 'expired',
      expiresAt: Date.now() + 60_000,
      userId: 'u-1',
    });
    const session = new SessionManager(storage);
    let called = 0;
    const client = makeClient('https://api.test', {
      session,
      onUnauthorized: () => { called += 1; },
    });
    try {
      await client.get('/fixtures/errors/401');
      expect.unreachable();
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      expect((err as ApiError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    }
    expect(session.token).toBeNull();
    expect(called).toBe(1);
  });
});
