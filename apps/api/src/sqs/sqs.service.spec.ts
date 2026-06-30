import { SqsService } from './sqs.service';
import type { ConfigService } from '@nestjs/config';
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs';

const mockSend = jest.fn();
const mockSqsClientConfigs: unknown[] = [];

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation((config: unknown) => {
    mockSqsClientConfigs.push(config);
    return { send: mockSend };
  }),
  GetQueueUrlCommand: jest.fn().mockImplementation((input: unknown) => ({
    input,
  })),
  SendMessageCommand: jest.fn().mockImplementation((input: unknown) => ({
    input,
  })),
}));

function createConfig(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn(
      (key: string, defaultValue?: string) => values[key] ?? defaultValue,
    ),
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];
      if (value === undefined) {
        throw new Error(`Missing config ${key}`);
      }
      return value;
    }),
  } as unknown as ConfigService;
}

beforeEach(() => {
  mockSend.mockReset();
  mockSqsClientConfigs.length = 0;
  jest.clearAllMocks();
});

describe('SqsService.safeMessageGroupId', () => {
  let service: SqsService;

  beforeEach(() => {
    // We only test the pure helper — no need to bootstrap the full module
    service = new SqsService(createConfig({ AWS_REGION: 'us-east-1' }));
  });

  it('returns serviceName unchanged when ≤128 chars', () => {
    const name = 'payments-service';
    const result = service.safeMessageGroupId(name);
    expect(result).toBe(name);
    expect(result.length).toBeLessThanOrEqual(128);
  });

  it('returns a ≤128 char deterministic value for a 255-char service name', () => {
    const longName = 'a'.repeat(255);
    const result = service.safeMessageGroupId(longName);
    expect(result.length).toBeLessThanOrEqual(128);
    // SHA-256 hex is always exactly 64 chars
    expect(result.length).toBe(64);
  });

  it('is deterministic — same input always produces same output', () => {
    const longName = 'x'.repeat(200);
    expect(service.safeMessageGroupId(longName)).toBe(
      service.safeMessageGroupId(longName),
    );
  });

  it('produces different values for different long names', () => {
    const a = service.safeMessageGroupId('a'.repeat(200));
    const b = service.safeMessageGroupId('b'.repeat(200));
    expect(a).not.toBe(b);
  });
});

describe('SqsService configuration', () => {
  it('does not require local AWS endpoint or static credentials in production', () => {
    const service = new SqsService(createConfig({ AWS_REGION: 'us-east-1' }));

    expect(service).toBeInstanceOf(SqsService);
    expect(SQSClient).toHaveBeenCalledTimes(1);
    expect(mockSqsClientConfigs[0]).toEqual({
      region: 'us-east-1',
    });
  });

  it('resolves the configured queue name', async () => {
    mockSend.mockResolvedValueOnce({
      QueueUrl:
        'https://sqs.us-east-1.amazonaws.com/123/shipnexus-production-deployments.fifo',
    });

    const service = new SqsService(
      createConfig({
        AWS_REGION: 'us-east-1',
        SQS_QUEUE_NAME: 'shipnexus-production-deployments.fifo',
      }),
    );

    await service.onModuleInit();

    expect(GetQueueUrlCommand).toHaveBeenCalledWith({
      QueueName: 'shipnexus-production-deployments.fifo',
    });
  });
});
