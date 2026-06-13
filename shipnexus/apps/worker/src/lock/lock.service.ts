import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService }                        from '@nestjs/config';
import Redis                                    from 'ioredis';

@Injectable()
export class LockService implements OnModuleDestroy {
  private readonly logger = new Logger(LockService.name);
  private readonly client: Redis;

  // Lock TTL must be longer than SQS_VISIBILITY_TIMEOUT
  // so a lock never expires while the job is still running
  private readonly TTL_SECONDS = 60;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(
      configService.getOrThrow<string>('REDIS_URL'),
      { lazyConnect: true },
    );
  }

  /**
   * Attempts to acquire a distributed lock for a given jobId.
   * SET NX EX: only succeeds if the key does NOT already exist.
   * Returns true if lock acquired, false if another worker holds it.
   */
  async acquire(jobId: string): Promise<boolean> {
    const result = await this.client.set(
      `lock:deployment:${jobId}`,
      '1',
      'EX',
      this.TTL_SECONDS,
      'NX',
    );

    const acquired = result === 'OK';

    if (!acquired) {
      this.logger.warn(`Lock already held for job ${jobId} — skipping`);
    }

    return acquired;
  }

  async release(jobId: string): Promise<void> {
    await this.client.del(`lock:deployment:${jobId}`);
    this.logger.debug(`Released lock for job ${jobId}`);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}