import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq }                 from 'drizzle-orm';
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

    // Start polling in background — don't await, it runs forever
    void this.poll();
  }

  async onModuleDestroy() {
    // Signal the poll loop to stop, then wait for current iteration to finish
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
            // Long polling — waits up to 20s for a message before returning empty
            // Drastically reduces empty receives vs short polling
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
      this.logger.error('Malformed SQS message — discarding', message.Body);
      return;
    }

    this.logger.log(`Received message for job ${jobId}`);

    // --- 2. Acquire distributed lock ---
    const locked = await this.lockService.acquire(jobId);
    if (!locked) return; // Another worker instance is handling this job

    try {
      // --- 3. Fetch full job record from Postgres (Claim Check resolution) ---
      const [job] = await this.db
        .select()
        .from(deploymentJobs)
        .where(eq(deploymentJobs.id, jobId));

      if (!job) {
        this.logger.error(`Job ${jobId} not found in DB — discarding message`);
        return;
      }

      this.logger.log(
        `Processing job ${job.id} | service=${job.serviceName} | image=${job.imageTag} | env=${job.environment}`,
      );

      // --- 4. Transition: pending → queued ---
      await this.db
        .update(deploymentJobs)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(eq(deploymentJobs.id, jobId));

      this.logger.log(`Job ${jobId} → queued`);

      // --- 5. Transition: queued → running ---
      await this.db
        .update(deploymentJobs)
        .set({
          status:    'running',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(deploymentJobs.id, jobId));

      this.logger.log(`Job ${jobId} → running`);

      // --- 6. Simulate deployment work ---
      // In Step 7+ this is replaced with real ECS/ECR SDK calls
      this.logger.log(
        `[SIMULATED] Deploying ${job.serviceName}:${job.imageTag} to ECS on ${job.environment}...`,
      );
      await new Promise((r) => setTimeout(r, 3_000));

      // --- 7. Transition: running → success ---
      await this.db
        .update(deploymentJobs)
        .set({
          status:      'success',
          completedAt: new Date(),
          updatedAt:   new Date(),
        })
        .where(eq(deploymentJobs.id, jobId));

      this.logger.log(`Job ${jobId} → success ✓`);

      // --- 8. Delete message from SQS — only on success ---
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl:      this.queueUrl,
          ReceiptHandle: message.ReceiptHandle!,
        }),
      );

      this.logger.log(`Message deleted from SQS for job ${jobId}`);
    } catch (err) {
      this.logger.error(`Job ${jobId} failed`, err);

      // Mark as failed in DB
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
      // Do NOT delete the SQS message on failure
      // It will reappear after VisibilityTimeout for retry
    } finally {
      await this.lockService.release(jobId);
    }
  }
}