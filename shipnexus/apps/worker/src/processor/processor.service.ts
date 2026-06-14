import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and }            from 'drizzle-orm';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import * as schema            from '../database/schema';
import { deploymentJobs }     from '../database/schema';
import { DATABASE_CLIENT }    from '../database/database.provider';
import { LockService }        from '../lock/lock.service';

@Injectable()
export class ProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessorService.name);
  private readonly client: SQSClient;
  private queueUrl: string;
  private isPolling  = false;
  private shouldPoll = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly lockService: LockService,
    @Inject(DATABASE_CLIENT)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {
    this.client = new SQSClient({
      region:   configService.getOrThrow<string>('AWS_REGION'),
      endpoint: configService.getOrThrow<string>('AWS_ENDPOINT_URL'),
      credentials: {
        accessKeyId:     configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async onModuleInit() {
    const response = await this.client.send(
      new GetQueueUrlCommand({
        QueueName: this.configService.getOrThrow<string>('SQS_QUEUE_NAME'),
      }),
    );
    this.queueUrl = response.QueueUrl!;
    this.logger.log(`Queue resolved: ${this.queueUrl}`);
    void this.poll();
  }

  async onModuleDestroy() {
    this.shouldPoll = false;
    while (this.isPolling) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  private async poll(): Promise<void> {
    this.logger.log('SQS polling started');

    while (this.shouldPoll) {
      this.isPolling = true;
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl:            this.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds:     Number(
              this.configService.get('SQS_WAIT_TIME_SECONDS', 20),
            ),
            VisibilityTimeout:   Number(
              this.configService.get('SQS_VISIBILITY_TIMEOUT', 30),
            ),
            AttributeNames: ['All'],
          }),
        );

        const messages = response.Messages ?? [];

        if (messages.length === 0) {
          this.logger.debug('No messages — long poll returned empty');
          continue;
        }

        for (const message of messages) {
          await this.handleMessage(message);
        }
      } catch (err) {
        this.logger.error('Poll error — will retry in 5s', err);
        await new Promise((r) => setTimeout(r, 5_000));
      } finally {
        this.isPolling = false;
      }
    }

    this.logger.log('SQS polling stopped');
  }

  // Deletes a message from SQS and logs any errors without throwing
  private async safeDeleteMessage(receiptHandle: string, context: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl:      this.queueUrl,
          ReceiptHandle: receiptHandle,
        }),
      );
      this.logger.log(`SQS message deleted (${context})`);
    } catch (err) {
      // Log but do NOT update DB state — delete failure is an SQS concern,
      // not a deployment failure. The message will redeliver after
      // VisibilityTimeout; the idempotency guard below will catch it.
      this.logger.error(`Failed to delete SQS message (${context})`, err);
    }
  }

  private async handleMessage(message: {
    Body?: string;
    ReceiptHandle?: string;
  }): Promise<void> {
    // --- 1. Parse the Claim Check message ---
    let jobId: string;
    try {
      const body = JSON.parse(message.Body ?? '{}');
      jobId = body.jobId;
      if (!jobId) throw new Error('Missing jobId in message body');
    } catch (err) {
      this.logger.error('Malformed SQS message body — deleting', message.Body);
      // Fix 13: delete poison messages so they don't block the queue
      await this.safeDeleteMessage(
        message.ReceiptHandle!,
        'malformed-body',
      );
      return;
    }

    this.logger.log(`Received message for job ${jobId}`);

    // --- 2. Acquire distributed lock ---
    const locked = await this.lockService.acquire(jobId);
    if (!locked) return;

    try {
      // --- 3. Fetch full job record (Claim Check resolution) ---
      const [job] = await this.db
        .select()
        .from(deploymentJobs)
        .where(eq(deploymentJobs.id, jobId));

      if (!job) {
        this.logger.error(`Job ${jobId} not found in DB — deleting message`);
        // Fix 13: delete unfulfillable messages
        await this.safeDeleteMessage(
          message.ReceiptHandle!,
          `job-not-found:${jobId}`,
        );
        return;
      }

      // Fix 14: idempotency guard — skip already-terminal jobs
      // Handles duplicate SQS deliveries after VisibilityTimeout
      if (job.status === 'success' || job.status === 'cancelled') {
        this.logger.warn(
          `Job ${jobId} already in terminal state (${job.status}) — deleting duplicate message`,
        );
        await this.safeDeleteMessage(
          message.ReceiptHandle!,
          `already-terminal:${jobId}`,
        );
        return;
      }

      this.logger.log(
        `Processing job ${job.id} | service=${job.serviceName} | image=${job.imageTag} | env=${job.environment}`,
      );

      // --- 4. pending → queued (only if currently pending) ---
      await this.db
        .update(deploymentJobs)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(
          and(
            eq(deploymentJobs.id, jobId),
            eq(deploymentJobs.status, 'pending'),
          ),
        );

      this.logger.log(`Job ${jobId} → queued`);

      // --- 5. queued → running (only if currently queued) ---
      await this.db
        .update(deploymentJobs)
        .set({
          status:    'running',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(deploymentJobs.id, jobId),
            eq(deploymentJobs.status, 'queued'),
          ),
        );

      this.logger.log(`Job ${jobId} → running`);

      // --- 6. Simulated deployment work ---
      this.logger.log(
        `[SIMULATED] Deploying ${job.serviceName}:${job.imageTag} to ECS on ${job.environment}...`,
      );
      await new Promise((r) => setTimeout(r, 3_000));

      // --- 7. running → success (only if currently running) ---
      // Fix 12: DB write to success BEFORE attempting SQS delete
      await this.db
        .update(deploymentJobs)
        .set({
          status:      'success',
          completedAt: new Date(),
          updatedAt:   new Date(),
        })
        .where(
          and(
            eq(deploymentJobs.id, jobId),
            eq(deploymentJobs.status, 'running'),
          ),
        );

      this.logger.log(`Job ${jobId} → success ✓`);

      // --- 8. Delete SQS message in its own scope ---
      // Fix 12: delete errors do NOT flip status to failed
      await this.safeDeleteMessage(
        message.ReceiptHandle!,
        `success:${jobId}`,
      );
    } catch (err) {
      // Only processing errors (before the success DB write) reach here
      this.logger.error(`Job ${jobId} failed during processing`, err);

      await this.db
        .update(deploymentJobs)
        .set({
          status:       'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
          completedAt:  new Date(),
          updatedAt:    new Date(),
        })
        .where(eq(deploymentJobs.id, jobId));

      this.logger.log(`Job ${jobId} → failed`);
      // Do NOT delete message — let it redeliver after VisibilityTimeout
    } finally {
      await this.lockService.release(jobId);
    }
  }
}