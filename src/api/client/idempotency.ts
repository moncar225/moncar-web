export interface IdempotencyOptions {
  methods?: ReadonlyArray<'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
  headerName?: string;
  generateKey?: () => string;
}

const DEFAULT_METHODS: ReadonlyArray<'POST' | 'PUT' | 'PATCH' | 'DELETE'> = [
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
] as const;

const DEFAULT_HEADER = 'Idempotency-Key' as const;

function defaultGenerateKey(): string {
  if (
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `idempot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface IdempotencyContext {
  apply(method: string, headers: Headers): void;
}

export class IdempotencyManager implements IdempotencyContext {
  private readonly methods: ReadonlySet<string>;
  private readonly headerName: string;
  private readonly generateKey: () => string;

  constructor(options: IdempotencyOptions = {}) {
    this.methods = new Set(options.methods ?? DEFAULT_METHODS);
    this.headerName = options.headerName ?? DEFAULT_HEADER;
    this.generateKey = options.generateKey ?? defaultGenerateKey;
  }

  apply(method: string, headers: Headers): void {
    if (!this.methods.has(method.toUpperCase())) return;
    if (headers.has(this.headerName)) return;
    headers.set(this.headerName, this.generateKey());
  }
}
