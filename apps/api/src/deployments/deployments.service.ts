import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DeploymentJob, deploymentJobs } from '../database/schema';
import * as schema from '../database/schema';
import { DATABASE_CLIENT } from '../database/database.provider';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentsDto } from './dto/query-deployments.dto';
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

  async findAll(query: QueryDeploymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const where = query.status
      ? eq(deploymentJobs.status, query.status)
      : undefined;

    const dataQuery = this.db
      .select()
      .from(deploymentJobs)
      .where(where)
      .orderBy(desc(deploymentJobs.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = this.db
      .select({ total: count() })
      .from(deploymentJobs)
      .where(where);

    const [data, [{ total }]] = await Promise.all([dataQuery, countQuery]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<DeploymentJob> {
    const [job] = await this.db
      .select()
      .from(deploymentJobs)
      .where(eq(deploymentJobs.id, id));

    if (!job) {
      throw new NotFoundException(`Deployment job ${id} not found`);
    }

    return job;
  }
}
