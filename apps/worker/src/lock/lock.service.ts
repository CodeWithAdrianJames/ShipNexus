import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { DEFAULT_SQS_VISIBILITY_TIMEOUT_SECONDS } from '../config/deployment-defaults';

@Injectable()
export class LockService implements OnModuleDestroy {
  private readonly logger = new Logger(LockService.name);
  private readonly client: Redis;

  // Lock TTL = visibility timeout + safety margin so the lock never
  // expires while a job is still inside its visibility window
  private readonly TTL_SECONDS: number;

  // Per-lock ownership tokens: jobId → token
  private readonly tokens = new Map<string, string>();

  // Atomic compare-and-delete Lua script — only deletes the key if
  // the stored value matches the caller's token (prevents a worker
  // from releasing a lock it no longer owns after TTL expiry)
  private static readonly RELEASE_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  constructor(private readonly configService: ConfigService) {
    const visibilityTimeout = Number(
      this.configService.get<number>(
        'SQS_VISIBILITY_TIMEOUT',
        DEFAULT_SQS_VISIBILITY_TIMEOUT_SECONDS,
      ),
    );
    // Add 15-second safety margin above the SQS visibility window
    this.TTL_SECONDS = visibilityTimeout + 15;

    this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
    });
  }

  /**
   * Attempts to acquire a distributed lock for a given jobId.
   * Uses SET NX EX with a unique ownership token.
   * Returns true if lock acquired, false if another worker holds it.
   */
  async acquire(jobId: string): Promise<boolean> {
    const token = randomUUID();
    const result = await this.client.set(
      `lock:deployment:${jobId}`,
      token,
      'EX',
      this.TTL_SECONDS,
      'NX',
    );

    const acquired = result === 'OK';

    if (acquired) {
      this.tokens.set(jobId, token);
    } else {
      this.logger.warn(`Lock already held for job ${jobId} — skipping`);
    }

    return acquired;
  }

  /**
   * Releases the lock only if this instance still owns it.
   * Uses an atomic Lua script to prevent accidental release of a
   * lock that was re-acquired by another worker after TTL expiry.
   */
  async release(jobId: string): Promise<void> {
    const token = this.tokens.get(jobId);

    if (!token) {
      this.logger.warn(
        `release() called for job ${jobId} but no token found — skipping`,
      );
      return;
    }

    const deleted = await this.client.eval(
      LockService.RELEASE_SCRIPT,
      1,
      `lock:deployment:${jobId}`,
      token,
    );

    this.tokens.delete(jobId);

    if (deleted === 1) {
      this.logger.debug(`Released lock for job ${jobId}`);
    } else {
      this.logger.warn(
        `Lock for job ${jobId} was already expired or taken — token mismatch`,
      );
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
