import { ConfigService } from '@nestjs/config';
import { LockService } from './lock.service';

const mockSet = jest.fn();
const mockQuit = jest.fn();

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    set: mockSet,
    quit: mockQuit,
  })),
);

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

describe('LockService', () => {
  beforeEach(() => {
    mockSet.mockResolvedValue('OK');
    jest.clearAllMocks();
  });

  it('uses a default lock TTL that covers ECS stability polling', async () => {
    const service = new LockService(
      createConfig({
        REDIS_URL: 'redis://localhost:6379',
      }),
    );

    await service.acquire('job-1');

    expect(mockSet).toHaveBeenCalledWith(
      'lock:deployment:job-1',
      expect.any(String),
      'EX',
      915,
      'NX',
    );
  });
});
