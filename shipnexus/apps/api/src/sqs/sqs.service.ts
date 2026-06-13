import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService }                    from '@nestjs/config';
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

  // Resolves the queue URL once on startup — fails fast if the queue doesn't exist
  async onModuleInit() {
    const command = new GetQueueUrlCommand({
      QueueName: 'shipnexus-deployments.fifo',
    });

    const response = await this.client.send(command);
    this.queueUrl  = response.QueueUrl!;

    this.logger.log(`SQS queue resolved: ${this.queueUrl}`);
  }

  async publishDeploymentJob(
    jobId:       string,
    serviceName: string,
  ): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl:                this.queueUrl,
      // Claim Check: only the ID travels over the wire
      MessageBody:             JSON.stringify({ jobId }),
      // Orders all messages for the same service sequentially
      MessageGroupId:          serviceName,
      // Deduplicates retried webhook triggers within 5-minute window
      MessageDeduplicationId:  jobId,
    });

    await this.client.send(command);

    this.logger.log(`Published job ${jobId} for service "${serviceName}" to SQS`);
  }
}