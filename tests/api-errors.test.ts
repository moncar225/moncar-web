import { describe, expect, it } from 'vitest';
import {
  API_ERROR_MESSAGES,
  classifyError,
  HTTP_STATUS,
  messageForStatusCode,
} from '@/api/errors/messages';
import { ApiError, extractFieldErrors, isApiError } from '@/api/errors/ApiError';

describe('messages & classifyError', () => {
  it('couvre 401, 403, 404, 409, 410, 422, 429, 500 et réseau (-1)', () => {
    const codes = [401, 403, 404, 409, 410, 422, 429, 500, -1];
    for (const code of codes) {
      const msg = messageForStatusCode(code);
      expect(msg, `code ${code}`).toSatisfy((m: string) => m.length > 0);
      expect(API_ERROR_MESSAGES[code]).toBe(msg);
    }
  });

  it('401 parle de session, 429 de trop de requêtes', () => {
    expect(messageForStatusCode(401)).toContain('session');
    expect(messageForStatusCode(429)).toContain('Trop de requêtes');
  });

  it('code inconnu → message générique, fallback prioritaire', () => {
    expect(messageForStatusCode(599)).toContain('erreur inattendue');
    expect(messageForStatusCode(507, 'Stockage insuffisant.')).toBe('Stockage insuffisant.');
  });

  it('classifyError discrimine sans confusion 403 ≠ 404 ≠ 401', () => {
    expect(classifyError(401)).toBe('auth');
    expect(classifyError(403)).toBe('forbidden');
    expect(classifyError(404)).toBe('notFound');
    expect(classifyError(409)).toBe('conflict');
    expect(classifyError(410)).toBe('gone');
    expect(classifyError(422)).toBe('validation');
    expect(classifyError(400)).toBe('validation');
    expect(classifyError(429)).toBe('tooManyRequests');
    expect(classifyError(500)).toBe('server');
    expect(classifyError(503)).toBe('server');
    expect(classifyError(-1)).toBe('network');
  });
});

describe('ApiError', () => {
  it('stocke statusCode, incidentId, et isNetworkError', () => {
    const err = new ApiError({
      statusCode: 500,
      incidentId: 'INC-123',
      serverMessage: 'oops',
    });
    expect(err.statusCode).toBe(500);
    expect(err.kind).toBe('server');
    expect(err.incidentId).toBe('INC-123');
    expect(err.serverMessage).toBe('oops');
    expect(err.isNetworkError).toBe(false);
    expect(isApiError(err)).toBe(true);

    const net = new ApiError({ statusCode: HTTP_STATUS.NETWORK_ERROR });
    expect(net.isNetworkError).toBe(true);
    expect(net.kind).toBe('network');
  });

  it('utilise le message serveur comme fallback via messageForStatusCode', () => {
    const err = new ApiError({
      statusCode: 507,
      serverMessage: 'Plus de place sur le périphérique.',
    });
    expect(err.message).toBe('Plus de place sur le périphérique.');
  });
});

describe('extractFieldErrors', () => {
  it('extrait {field,message} depuis le corps 422 standard', () => {
    const out = extractFieldErrors({
      errors: [
        { field: 'email', message: 'Email invalide.' },
        { field: 'password', message: 'Trop court.' },
      ],
    });
    expect(out).toEqual([
      { field: 'email', message: 'Email invalide.' },
      { field: 'password', message: 'Trop court.' },
    ]);
  });

  it('ignore les entrées malformées et les corps inattendus', () => {
    expect(extractFieldErrors(null)).toEqual([]);
    expect(extractFieldErrors({ errors: [{ not: 'a field' }, 'x'] })).toEqual([]);
    expect(extractFieldErrors({})).toEqual([]);
  });
});
