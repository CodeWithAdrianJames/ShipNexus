import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  OnModuleDestroy,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs';
import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Response } from 'express';
import { DATABASE_CLIENT } from '../database/database.provider';
import * as schema from '../database/schema';

type CheckStatus = 'up' | 'down';

type HealthResponse = {
  status: 'ok' | 'error';
  checks: {
    database: CheckStatus;
    sqs: CheckStatus;
  };
};

@Controller('health')
export class HealthController implements OnModuleDestroy {
  private readonly sqsClient: SQSClient;
  private readonly queueName: string;

  constructor(
    private readonly health: HealthCheckService,
    private readonly indicators: HealthIndicatorService,
    @Inject(DATABASE_CLIENT)
    private readonly db: PostgresJsDatabase<typeof schema>,
    configService: ConfigService,
  ) {
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

    this.sqsClient = new SQSClient(clientConfig);
    this.queueName = configService.get<string>(
      'SQS_QUEUE_NAME',
      'shipnexus-deployments.fifo',
    );
  }

  @Get()
  @HealthCheck()
  async check(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthResponse> {
    // Redis is omitted because the API has no Redis client or provider.
    try {
      const result = await this.health.check([
        () => this.checkDatabase(),
        () => this.checkSqs(),
      ]);

      return {
        status: 'ok',
        checks: this.toChecks(result.details),
      };
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) {
        throw error;
      }

      const terminusResponse = error.getResponse();
      const details =
        typeof terminusResponse === 'object' &&
        terminusResponse !== null &&
        'details' in terminusResponse
          ? (terminusResponse as HealthCheckResult).details
          : {};

      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'error',
        checks: this.toChecks(details),
      };
    }
  }

  onModuleDestroy(): void {
    this.sqsClient.destroy();
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const indicator = this.indicators.check('database');

    try {
      await this.db.execute(sql`select 1`);
      return indicator.up();
    } catch (error) {
      return indicator.down(this.errorMessage(error));
    }
  }

  private async checkSqs(): Promise<HealthIndicatorResult> {
    const indicator = this.indicators.check('sqs');

    try {
      await this.sqsClient.send(
        new GetQueueUrlCommand({ QueueName: this.queueName }),
      );
      return indicator.up();
    } catch (error) {
      return indicator.down(this.errorMessage(error));
    }
  }

  private toChecks(details: HealthCheckResult['details']): HealthResponse['checks'] {
    return {
      database: details.database?.status === 'up' ? 'up' : 'down',
      sqs: details.sqs?.status === 'up' ? 'up' : 'down',
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
