import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase }          from 'drizzle-orm/postgres-js';
import { deploymentJobs }              from '../database/schema';
import * as schema                     from '../database/schema';
import { DATABASE_CLIENT }             from '../database/database.provider';
import { CreateDeploymentDto }         from './dto/create-deployment.dto';
import { SqsService }                  from '../sqs/sqs.service';

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly sqsService: SqsService,
  ) {}

  async create(dto: CreateDeploymentDto) {
    // 1. Write the job record first — the DB is the source of truth
    const [job] = await this.db
      .insert(deploymentJobs)
      .values({
        serviceName:  dto.serviceName,
        imageTag:     dto.imageTag,
        environment:  dto.environment ?? 'production',
        triggeredBy:  dto.triggeredBy,
        payload:      dto.payload ?? null,
        status:       'pending',
      })
      .returning();

    this.logger.log(`Created deployment job ${job.id} for ${job.serviceName}`);

    // 2. Publish only the ID — the worker fetches the rest from Postgres
    await this.sqsService.publishDeploymentJob(job.id, job.serviceName);

    return job;
  }

  async findAll() {
    return this.db.select().from(deploymentJobs);
  }
}