import { HttpClient } from './HttpClient';
import type { HttpClientConfig, RequestOptions, HttpMethod } from './HttpClient';
import { IdempotencyManager } from './idempotency';
import type { IdempotencyOptions, IdempotencyContext } from './idempotency';
import { SessionManager } from './session';
import type {
  SessionStorage,
  StoredSession,
  RefreshTokenFn,
  tryRefresh as _tryRefresh,
} from './session';
import { TimestampManager } from './timestamp';
import type { TimestampOptions, TimestampContext } from './timestamp';
import { env } from '@/lib/env';

export { HttpClient, IdempotencyManager, SessionManager, TimestampManager };

export type {
  HttpClientConfig,
  RequestOptions,
  HttpMethod,
  IdempotencyOptions,
  IdempotencyContext,
  SessionStorage,
  StoredSession,
  RefreshTokenFn,
  TimestampOptions,
  TimestampContext,
};

export const sessionManager = new SessionManager();

export const idempotencyManager = new IdempotencyManager();

export const timestampManager = new TimestampManager({
  enabled: false,
});

/**
 * Base de l'API (`…/api/v1`). Sans API configurée, les appels partent vers
 * `<origine>/api/v1`, interceptés par le faux backend MSW quand il est actif.
 */
function apiBaseUrl(): string {
  if (env.apiBaseUrl.length > 0) return env.apiBaseUrl;
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  return `${origin}/api/v1`;
}

export const httpClient = new HttpClient({
  baseUrl: apiBaseUrl(),
  session: sessionManager,
  idempotency: idempotencyManager,
  timestamp: timestampManager,
});

export type AppHttpClient = HttpClient;
