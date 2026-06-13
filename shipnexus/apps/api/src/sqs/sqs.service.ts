import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService }                    from '@nestjs/config';
import { createHash }                       from 'crypto';
import {
  SQSClient,
  SendMessageCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService implements OnModuleInit {
  private readonly logger = new Logger(SqsService.name);
  private readonly client: SQSClient;
  private queueUrl: string;

  constructor(private readonly configService: ConfigService) {
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
    const command = new GetQueueUrlCommand({
      QueueName: 'shipnexus-deployments.fifo',
    });
    const response  = await this.client.send(command);
    this.queueUrl   = response.QueueUrl!;
    this.logger.log(`SQS queue resolved: ${this.queueUrl}`);
  }

  /**
   * SQS hard-limits MessageGroupId to 128 chars.
   * serviceName is varchar(255) so we must guard against overflow.
   * For names ≤128 chars: use as-is (human-readable, easier to debug).
   * For names >128 chars: SHA-256 hex (always 64 chars) — deterministic
   * and collision-resistant, uniqueness is fully preserved.
   */
  safeMessageGroupId(serviceName: string): string {
    if (serviceName.length <= 128) return serviceName;
    return createHash('sha256').update(serviceName).digest('hex');
  }

  async publishDeploymentJob(
    jobId:              string,
    serviceName:        string,
    deduplicationId:    string,
  ): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl:               this.queueUrl,
      MessageBody:            JSON.stringify({ jobId }),
      MessageGroupId:         this.safeMessageGroupId(serviceName),
      MessageDeduplicationId: deduplicationId,
    });

    await this.client.send(command);
    this.logger.log(`Published job ${jobId} for service "${serviceName}" to SQS`);
  }
}