export interface TimestampOptions {
  headerName?: string;
  getNow?: () => number;
  enabled?: boolean;
}

const DEFAULT_HEADER = 'X-Request-Timestamp' as const;

export interface TimestampContext {
  apply(headers: Headers): void;
}

export class TimestampManager implements TimestampContext {
  private readonly headerName: string;
  private readonly getNow: () => number;
  private readonly enabled: boolean;

  constructor(options: TimestampOptions = {}) {
    this.headerName = options.headerName ?? DEFAULT_HEADER;
    this.getNow = options.getNow ?? (() => Date.now());
    this.enabled = options.enabled ?? false;
  }

  apply(headers: Headers): void {
    if (!this.enabled) return;
    if (headers.has(this.headerName)) return;
    headers.set(this.headerName, this.getNow().toString(10));
  }
}
