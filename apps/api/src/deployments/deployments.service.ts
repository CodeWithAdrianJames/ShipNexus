import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DeploymentJob, deploymentJobs } from '../database/schema';
import * as schema from '../database/schema';
import { DATABASE_CLIENT } from '../database/database.provider';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentsDto } from './dto/query-deployments.dto';
import { SqsService } from '../sqs/sqs.service';

type RedactedDeploymentJob = Omit<DeploymentJob, 'payload' | 'errorMessage'>;

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly sqsService: SqsService,
  ) {}

  async create(dto: CreateDeploymentDto) {
    if (dto.webhookEventId) {
      const [existingJob] = await this.db
        .select()
        .from(deploymentJobs)
        .where(eq(deploymentJobs.webhookEventId, dto.webhookEventId))
        .limit(1);

      if (existingJob) {
        this.logger.log(
          `Returning existing deployment job ${existingJob.id} for ` +
            `webhookEventId ${dto.webhookEventId}`,
        );
        return existingJob;
      }
    } else {
      this.logger.warn(
        'Deployment created without webhookEventId — ' +
          'duplicate webhook deliveries cannot be detected for this job.',
      );
    }

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

    // TODO: SQS publish failures have no automatic retry path. Guaranteed
    // delivery requires a transactional outbox table and background publisher.
    try {
      await this.sqsService.publishDeploymentJob(
        job.id,
        job.serviceName,
        deduplicationId,
      );
    } catch (error) {
      const originalMessage =
        error instanceof Error ? error.message : String(error);
      const errorMessage = `Failed to queue deployment: ${originalMessage}`;

      this.logger.error(
        `Failed to queue deployment job ${job.id}: ${originalMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      const [failedJob] = await this.db
        .update(deploymentJobs)
        .set({
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(deploymentJobs.id, job.id))
        .returning();

      return failedJob;
    }

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
      data: data.map((job) => this.redactDeploymentJob(job)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<RedactedDeploymentJob> {
    const [job] = await this.db
      .select()
      .from(deploymentJobs)
      .where(eq(deploymentJobs.id, id));

    if (!job) {
      throw new NotFoundException(`Deployment job ${id} not found`);
    }

    return this.redactDeploymentJob(job);
  }

  private redactDeploymentJob(job: DeploymentJob): RedactedDeploymentJob {
    const { payload: _payload, errorMessage: _errorMessage, ...safeJob } = job;
    return safeJob;
  }
}
