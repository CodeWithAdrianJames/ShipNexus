import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
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
  private readonly queueName: string;

  constructor(private readonly configService: ConfigService) {
    const clientConfig: ConstructorParameters<typeof SQSClient>[0] = {
      region: configService.getOrThrow<string>('AWS_REGION'),
    };
    const endpoint = configService.get<string>('AWS_ENDPOINT_URL');
    const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (endpoint) {
      clientConfig.endpoint = endpoint;
    }

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = { accessKeyId, secretAccessKey };
    }

    this.client = new SQSClient(clientConfig);
    this.queueName = configService.get<string>(
      'SQS_QUEUE_NAME',
      'shipnexus-deployments.fifo',
    );
  }

  async onModuleInit() {
    const command = new GetQueueUrlCommand({
      QueueName: this.queueName,
    });
    const response = await this.client.send(command);
    this.queueUrl = response.QueueUrl!;
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
    jobId: string,
    serviceName: string,
    deduplicationId: string,
  ): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({ jobId }),
      MessageGroupId: this.safeMessageGroupId(serviceName),
      MessageDeduplicationId: deduplicationId,
    });

    await this.client.send(command);
    this.logger.log(
      `Published job ${jobId} for service "${serviceName}" to SQS`,
    );
  }
}
