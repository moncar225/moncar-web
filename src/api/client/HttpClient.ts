import type { IdempotencyContext } from './idempotency';
import type { SessionManager } from './session';
import type { TimestampContext } from './timestamp';
import { ApiError, extractFieldErrors, HTTP_STATUS, isApiError } from '../errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
  body?: unknown;
  signal?: AbortSignal;
  /**
   * Si `true`, l'Idempotency-Key n'est pas ajoutée même pour les méthodes
   * sensibles (POST/PUT/PATCH/DELETE). À utiliser lorsque le header est
   * déjà positionné ou que l'opération ne doit pas être idempotente.
   */
  skipIdempotency?: boolean;
  /**
   * Si `true`, le token d'autorisation n'est pas ajouté même si une
   * session est active (routes publiques : login, health, etc.).
   */
  skipAuth?: boolean;
}

export interface HttpClientConfig {
  baseUrl: string;
  session: SessionManager;
  idempotency: IdempotencyContext;
  timestamp: TimestampContext;
  onUnauthorized?: () => void;
  onRefresh?: (refreshToken: string) => Promise<{ token: string; refreshToken?: string; expiresAt: number }>;
}

function buildQueryString(query: RequestOptions['query']): string {
  if (query === undefined) return '';
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const values: ReadonlyArray<string | number | boolean> = Array.isArray(rawValue)
      ? rawValue
      : [rawValue];
    for (const value of values) {
      params.append(key, String(value));
    }
  }
  const result = params.toString();
  return result.length === 0 ? '' : `?${result}`;
}

function extractIncidentId(response: Response, body: unknown): string | undefined {
  const header = response.headers.get('x-request-id');
  if (header !== null && header.length > 0) return header;
  if (body !== null && typeof body === 'object') {
    const maybe = body as { incidentId?: unknown; requestId?: unknown };
    if (typeof maybe.incidentId === 'string' && maybe.incidentId.length > 0) {
      return maybe.incidentId;
    }
    if (typeof maybe.requestId === 'string' && maybe.requestId.length > 0) {
      return maybe.requestId;
    }
  }
  return undefined;
}

function extractServerMessage(body: unknown): string | undefined {
  if (body !== null && typeof body === 'object') {
    const maybe = body as { message?: unknown; detail?: unknown; error?: unknown };
    for (const key of ['message', 'detail', 'error'] as const) {
      const value = maybe[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return undefined;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly session: SessionManager;
  private readonly idempotency: IdempotencyContext;
  private readonly timestamp: TimestampContext;
  private readonly onUnauthorized: (() => void) | undefined;
  private readonly onRefresh: HttpClientConfig['onRefresh'];
  private refreshLock: Promise<{ token: string; refreshToken?: string; expiresAt: number } | null> | null = null;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.session = config.session;
    this.idempotency = config.idempotency;
    this.timestamp = config.timestamp;
    this.onUnauthorized = config.onUnauthorized;
    this.onRefresh = config.onRefresh;
  }

  async get<TResponse>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<TResponse> {
    return this.request<TResponse>(path, { ...options, method: 'GET' });
  }

  async post<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    return this.request<TResponse>(path, { ...options, method: 'POST' });
  }

  async put<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    return this.request<TResponse>(path, { ...options, method: 'PUT' });
  }

  async patch<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    return this.request<TResponse>(path, { ...options, method: 'PATCH' });
  }

  async delete<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    return this.request<TResponse>(path, { ...options, method: 'DELETE' });
  }

  private async request<TResponse>(rawPath: string, options: RequestOptions): Promise<TResponse> {
    const method = (options.method ?? 'GET').toUpperCase() as HttpMethod;
    const url = `${this.baseUrl}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}${buildQueryString(options.query)}`;
    try {
      return await this.runOnce<TResponse>(url, method, options, { allowRefresh: true });
    } catch (error) {
      if (this.onRefresh !== undefined && isApiError(error) && error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
        const refreshed = await this.ensureRefreshed();
        if (refreshed !== null) {
          return this.runOnce<TResponse>(url, method, options, { allowRefresh: false });
        }
      }
      throw error;
    }
  }

  private async runOnce<TResponse>(
    url: string,
    method: HttpMethod,
    options: RequestOptions,
    _flags: { allowRefresh: boolean },
  ): Promise<TResponse> {
    const headers = new Headers(options.headers);

    if (!options.skipAuth) {
      const token = this.session.token;
      if (token !== null && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (method !== 'GET' && !options.skipIdempotency) {
      this.idempotency.apply(method, headers);
    }
    this.timestamp.apply(headers);

    let body: BodyInit | null = null;
    if (options.body !== undefined && options.body !== null) {
      if (options.body instanceof FormData || options.body instanceof URLSearchParams || typeof options.body === 'string') {
        body = options.body;
      } else {
        body = JSON.stringify(options.body);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body,
        signal: options.signal,
        credentials: 'same-origin',
      });
    } catch (cause) {
      throw new ApiError({
        statusCode: HTTP_STATUS.NETWORK_ERROR,
        cause,
      });
    }

    let parsed: unknown = null;
    const contentType = response.headers.get('content-type');
    if (contentType !== null && contentType.includes('application/json')) {
      try {
        parsed = (await response.json()) as unknown;
      } catch {
        parsed = null;
      }
    }

    if (response.ok) {
      return parsed as TResponse;
    }

    const statusCode = response.status;
    const incidentId = extractIncidentId(response, parsed);
    const serverMessage = extractServerMessage(parsed);

    if (statusCode === HTTP_STATUS.UNAUTHORIZED) {
      this.session.clear();
      queueMicrotask(() => {
        this.onUnauthorized?.();
      });
    }

    if (statusCode === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
      void extractFieldErrors(parsed);
    }

    throw new ApiError({
      statusCode,
      serverMessage,
      incidentId,
    });
  }

  private async ensureRefreshed(): Promise<{ token: string; refreshToken?: string; expiresAt: number } | null> {
    if (this.onRefresh === undefined) return null;
    if (this.refreshLock === null) {
      const current = this.session.get();
      if (current === null || current.refreshToken === undefined) return null;
      this.refreshLock = (async () => {
        try {
          const result = await this.onRefresh!(current!.refreshToken!);
          this.session.set({
            token: result.token,
            refreshToken: result.refreshToken,
            expiresAt: result.expiresAt,
            userId: current!.userId,
          });
          return result;
        } catch {
          this.session.clear();
          this.onUnauthorized?.();
          return null;
        } finally {
          this.refreshLock = null;
        }
      })();
    }
    return this.refreshLock;
  }
}
