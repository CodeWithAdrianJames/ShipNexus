import { SqsService } from './sqs.service';

describe('SqsService.safeMessageGroupId', () => {
  let service: SqsService;

  beforeEach(() => {
    // We only test the pure helper — no need to bootstrap the full module
    service = new SqsService({ getOrThrow: () => 'test' } as any);
  });

  it('returns serviceName unchanged when ≤128 chars', () => {
    const name   = 'payments-service';
    const result = service.safeMessageGroupId(name);
    expect(result).toBe(name);
    expect(result.length).toBeLessThanOrEqual(128);
  });

  it('returns a ≤128 char deterministic value for a 255-char service name', () => {
    const longName = 'a'.repeat(255);
    const result   = service.safeMessageGroupId(longName);
    expect(result.length).toBeLessThanOrEqual(128);
    // SHA-256 hex is always exactly 64 chars
    expect(result.length).toBe(64);
  });

  it('is deterministic — same input always produces same output', () => {
    const longName = 'x'.repeat(200);
    expect(service.safeMessageGroupId(longName))
      .toBe(service.safeMessageGroupId(longName));
  });

  it('produces different values for different long names', () => {
    const a = service.safeMessageGroupId('a'.repeat(200));
    const b = service.safeMessageGroupId('b'.repeat(200));
    expect(a).not.toBe(b);
  });
});
