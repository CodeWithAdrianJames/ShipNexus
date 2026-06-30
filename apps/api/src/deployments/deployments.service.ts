import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { deploymentJobs } from '../database/schema';
import * as schema from '../database/schema';
import { DATABASE_CLIENT } from '../database/database.provider';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { SqsService } from '../sqs/sqs.service';

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly sqsService: SqsService,
  ) {}

  async create(dto: CreateDeploymentDto) {
    const [job] = await this.db
      .insert(deploymentJobs)
      .values({
        serviceName: dto.serviceName,
        imageTag: dto.imageTag,
        environment: dto.environment ?? 'production',
        triggeredBy: dto.triggeredBy,
        webhookEventId: dto.webhookEventId ?? null,
        payload: dto.payload ?? null,
        status: 'pending',
      })
      .returning();

    this.logger.log(`Created deployment job ${job.id} for ${job.serviceName}`);

    // Use webhookEventId as the stable deduplication key if provided,
    // otherwise fall back to job.id. This means: if the caller supplies
    // a webhookEventId, SQS will silently drop retried webhook fires
    // within the 5-minute dedup window. Without it, each retry creates
    // a new job.id and bypasses dedup — callers should always provide it.
    const deduplicationId = job.webhookEventId ?? job.id;

    await this.sqsService.publishDeploymentJob(
      job.id,
      job.serviceName,
      deduplicationId,
    );

    return job;
  }

  async findAll() {
    return this.db.select().from(deploymentJobs);
  }
}
