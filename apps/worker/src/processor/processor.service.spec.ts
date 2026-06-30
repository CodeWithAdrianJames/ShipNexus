import { ConfigService } from '@nestjs/config';
import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ProcessorService } from './processor.service';
import type { LockService } from '../lock/lock.service';
import type { EcsService } from '../ecs/ecs.service';
import type * as schema from '../database/schema';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  ReceiveMessageCommand: jest.fn().mockImplementation((input: unknown) => ({
    input,
  })),
  DeleteMessageCommand: jest.fn().mockImplementation((input: unknown) => ({
    input,
  })),
  GetQueueUrlCommand: jest.fn().mockImplementation((input: unknown) => ({
    input,
  })),
}));

function createConfig(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn(
      (key: string, defaultValue?: string | number) =>
        values[key] ?? defaultValue,
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

function createDb() {
  const returningQueued = jest.fn().mockResolvedValue([{ id: 'job-1' }]);
  const returningRunning = jest.fn().mockResolvedValue([{ id: 'job-1' }]);
  const updateWhere = jest
    .fn()
    .mockReturnValueOnce({ returning: returningQueued })
    .mockReturnValueOnce({ returning: returningRunning })
    .mockResolvedValueOnce([]);

  return {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValue([
          {
            id: 'job-1',
            serviceName: 'api',
            imageTag: 'sha-123',
            environment: 'production',
            status: 'pending',
          },
        ]),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: updateWhere,
      })),
    })),
  };
}

describe('ProcessorService failed job handling', () => {
  beforeEach(() => {
    mockSend.mockResolvedValue({});
    jest.clearAllMocks();
  });

  it('deletes the SQS message after ECS reports a failed deployment', async () => {
    const release = jest.fn().mockResolvedValue(undefined);
    const lockService = {
      acquire: jest.fn().mockResolvedValue(true),
      release,
    } as unknown as LockService;
    const ecsService = {
      triggerDeployment: jest.fn().mockResolvedValue(undefined),
      waitForStability: jest.fn().mockResolvedValue('failed'),
    } as unknown as EcsService;
    const db = createDb();
    const service = new ProcessorService(
      createConfig({
        AWS_REGION: 'us-east-1',
        AWS_ENDPOINT_URL: 'http://localhost:4567',
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
      }),
      lockService,
      ecsService,
      db as unknown as PostgresJsDatabase<typeof schema>,
    );

    (service as unknown as { queueUrl: string }).queueUrl =
      'https://sqs.us-east-1.amazonaws.com/123/shipnexus-production-deployments.fifo';

    await (
      service as unknown as {
        handleMessage(message: {
          Body?: string;
          ReceiptHandle?: string;
        }): Promise<void>;
      }
    ).handleMessage({
      Body: JSON.stringify({ jobId: 'job-1' }),
      ReceiptHandle: 'receipt-1',
    });

    expect(DeleteMessageCommand).toHaveBeenCalledWith({
      QueueUrl:
        'https://sqs.us-east-1.amazonaws.com/123/shipnexus-production-deployments.fifo',
      ReceiptHandle: 'receipt-1',
    });
    expect(release).toHaveBeenCalledWith('job-1');
    expect(SQSClient).toHaveBeenCalledTimes(1);
  });
});
