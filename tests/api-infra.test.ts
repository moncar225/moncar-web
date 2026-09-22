import { describe, expect, it } from 'vitest';
import { IdempotencyManager } from '@/api/client/idempotency';
import { TimestampManager } from '@/api/client/timestamp';

describe('IdempotencyManager', () => {
  it('ajoute Idempotency-Key sur POST/PUT/PATCH/DELETE et saute GET', () => {
    const manager = new IdempotencyManager({ generateKey: () => 'key-fixed' });

    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const headers = new Headers();
      manager.apply(m, headers);
      expect(headers.get('Idempotency-Key'), m).toBe('key-fixed');
    }

    const get = new Headers();
    manager.apply('GET', get);
    expect(get.has('Idempotency-Key')).toBe(false);
  });

  it('n’écrase pas un header déjà positionné', () => {
    const manager = new IdempotencyManager({ generateKey: () => 'auto' });
    const h = new Headers({ 'Idempotency-Key': 'already-set' });
    manager.apply('POST', h);
    expect(h.get('Idempotency-Key')).toBe('already-set');
  });
});

describe('TimestampManager', () => {
  it('désactivé par défaut, activé ajoute le header', () => {
    const disabled = new TimestampManager();
    const h = new Headers();
    disabled.apply(h);
    expect(h.has('X-Request-Timestamp')).toBe(false);

    const enabled = new TimestampManager({ enabled: true, getNow: () => 1_700_000_000_000 });
    const h2 = new Headers();
    enabled.apply(h2);
    expect(h2.get('X-Request-Timestamp')).toBe('1700000000000');
  });
});
