import { classifyError, messageForStatusCode, type ErrorKind } from './messages';

export interface ApiErrorInit {
  statusCode: number;
  message?: string;
  incidentId?: string;
  serverMessage?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly incidentId: string | undefined;
  public readonly serverMessage: string | undefined;
  public override readonly cause: unknown;
  public readonly kind: ErrorKind;

  constructor(init: ApiErrorInit) {
    const message = init.message ?? messageForStatusCode(init.statusCode, init.serverMessage);
    super(message);
    this.name = 'ApiError';
    this.statusCode = init.statusCode;
    this.incidentId = init.incidentId;
    this.serverMessage = init.serverMessage;
    this.cause = init.cause;
    this.kind = classifyError(init.statusCode);
  }

  get isNetworkError(): boolean {
    return this.statusCode === -1;
  }

  get userMessage(): string {
    return this.message;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export interface FieldError {
  field: string;
  message: string;
}

export function extractFieldErrors(
  body: unknown,
): ReadonlyArray<FieldError> {
  if (
    body !== null &&
    typeof body === 'object' &&
    'errors' in body &&
    Array.isArray((body as { errors?: unknown }).errors)
  ) {
    const list = (body as { errors: unknown[] }).errors;
    const result: FieldError[] = [];
    for (const entry of list) {
      if (
        entry !== null &&
        typeof entry === 'object' &&
        'field' in entry &&
        'message' in entry
      ) {
        const field = (entry as { field?: unknown }).field;
        const message = (entry as { message?: unknown }).message;
        if (typeof field === 'string' && typeof message === 'string') {
          result.push({ field, message });
        }
      }
    }
    return result;
  }
  return [];
}
