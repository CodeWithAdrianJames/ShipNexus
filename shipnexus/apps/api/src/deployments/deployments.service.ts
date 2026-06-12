import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase }  from 'drizzle-orm/postgres-js';
import { deploymentJobs }      from '../database/schema';
import * as schema             from '../database/schema';
import { DATABASE_CLIENT }     from '../database/database.provider';
import { CreateDeploymentDto } from './dto/create-deployment.dto';

@Injectable()
export class DeploymentsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CreateDeploymentDto) {
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

    return job;
  }

  async findAll() {
    return this.db.select().from(deploymentJobs);
  }
}