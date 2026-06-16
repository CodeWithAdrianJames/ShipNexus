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
import * as schema         from '../database/schema';
import { deploymentJobs }  from '../database/schema';
import { DATABASE_CLIENT } from '../database/database.provider';
import { LockService }     from '../lock/lock.service';
import { EcsService }      from '../ecs/ecs.service';

@Injectable()
export class ProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessorService.name);
  private readonly client: SQSClient;
  private queueUrl: string;
  private isPolling  = false;
  private shouldPoll = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly lockService:   LockService,
    private readonly ecsService:    EcsService,
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
            WaitTimeSeconds:     Number(this.configService.get('SQS_WAIT_TIME_SECONDS', 20)),
            VisibilityTimeout:   Number(this.configService.get('SQS_VISIBILITY_TIMEOUT', 30)),
            AttributeNames:      ['All'],
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
      this.logger.error(`Failed to delete SQS message (${context})`, err);
    }
  }

  private async handleMessage(message: {
    Body?: string;
    ReceiptHandle?: string;
  }): Promise<void> {
    // --- 1. Parse Claim Check ---
    let jobId: string;
    try {
      const body = JSON.parse(message.Body ?? '{}');
      jobId = body.jobId;
      if (!jobId) throw new Error('Missing jobId in message body');
    } catch {
      this.logger.error('Malformed SQS message — deleting', message.Body);
      await this.safeDeleteMessage(message.ReceiptHandle!, 'malformed-body');
      return;
    }

    this.logger.log(`Received message for job ${jobId}`);

    // --- 2. Distributed lock ---
    const locked = await this.lockService.acquire(jobId);
    if (!locked) return;

    try {
      // --- 3. Claim Check resolution ---
      const [job] = await this.db
        .select()
        .from(deploymentJobs)
        .where(eq(deploymentJobs.id, jobId));

      if (!job) {
        this.logger.error(`Job ${jobId} not found in DB — deleting message`);
        await this.safeDeleteMessage(message.ReceiptHandle!, `job-not-found:${jobId}`);
        return;
      }

      // --- 4. Idempotency guard ---
      if (job.status === 'success' || job.status === 'cancelled') {
        this.logger.warn(`Job ${jobId} already terminal (${job.status}) — skipping`);
        await this.safeDeleteMessage(message.ReceiptHandle!, `already-terminal:${jobId}`);
        return;
      }

      this.logger.log(
        `Processing job ${job.id} | service=${job.serviceName} | image=${job.imageTag} | env=${job.environment}`,
      );

      // --- 5. pending → queued (Fix 3: check affected rows) ---
      const queuedRows = await this.db
        .update(deploymentJobs)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(and(eq(deploymentJobs.id, jobId), eq(deploymentJobs.status, 'pending')))
        .returning({ id: deploymentJobs.id });

      if (queuedRows.length === 0) {
        this.logger.warn(
          `Job ${jobId} transition pending→queued matched 0 rows — ` +
          `status may have changed concurrently; skipping`,
        );
        return;
      }

      this.logger.log(`Job ${jobId} → queued`);

      // --- 6. queued → running (Fix 3: check affected rows) ---
      const runningRows = await this.db
        .update(deploymentJobs)
        .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(deploymentJobs.id, jobId), eq(deploymentJobs.status, 'queued')))
        .returning({ id: deploymentJobs.id });

      if (runningRows.length === 0) {
        this.logger.warn(
          `Job ${jobId} transition queued→running matched 0 rows — skipping ECS trigger`,
        );
        return;
      }

      this.logger.log(`Job ${jobId} → running`);

      // --- 7. Trigger ECS deployment ---
      await this.ecsService.triggerDeployment(job.serviceName);
      const result = await this.ecsService.waitForStability(job.serviceName);

      this.logger.log(`ECS deployment result for job ${jobId}: ${result}`);

      if (result === 'success') {
        // Fix 3: check affected rows for running→success
        const successRows = await this.db
          .update(deploymentJobs)
          .set({ status: 'success', completedAt: new Date(), updatedAt: new Date() })
          .where(and(eq(deploymentJobs.id, jobId), eq(deploymentJobs.status, 'running')))
          .returning({ id: deploymentJobs.id });

        if (successRows.length === 0) {
          this.logger.warn(
            `Job ${jobId} transition running→success matched 0 rows — ` +
            `state may have been modified externally`,
          );
        } else {
          this.logger.log(`Job ${jobId} → success ✓`);
        }

        await this.safeDeleteMessage(message.ReceiptHandle!, `success:${jobId}`);
      } else {
        const errorMessage =
          result === 'timeout'
            ? `ECS deployment timed out after ${this.configService.get('ECS_POLL_MAX_ATTEMPTS', 40)} polling attempts`
            : `ECS reported deployment FAILED — check ECS events for ${job.serviceName}`;

        await this.db
          .update(deploymentJobs)
          .set({
            status:       'failed',
            errorMessage,
            completedAt:  new Date(),
            updatedAt:    new Date(),
          })
          // Fix 3: only overwrite if still in running state
          .where(and(eq(deploymentJobs.id, jobId), eq(deploymentJobs.status, 'running')));

        this.logger.error(`Job ${jobId} → failed (${result})`);
      }
    } catch (err) {
      this.logger.error(`Job ${jobId} failed during processing`, err);

      // Fix 3: only mark failed if currently in running state
      await this.db
        .update(deploymentJobs)
        .set({
          status:       'failed',
          errorMessage: err instanceof Error ? err.message : String(err),
          completedAt:  new Date(),
          updatedAt:    new Date(),
        })
        .where(
          and(
            eq(deploymentJobs.id, jobId),
            eq(deploymentJobs.status, 'running'),
          ),
        );

      this.logger.log(`Job ${jobId} → failed`);
    } finally {
      await this.lockService.release(jobId);
    }
  }
}