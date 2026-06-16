import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import {
  ECSClient,
  UpdateServiceCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';

export type DeploymentResult = 'success' | 'failed' | 'timeout';

@Injectable()
export class EcsService {
  private readonly logger = new Logger(EcsService.name);
  private readonly client: ECSClient;
  private readonly clusterName:       string;
  private readonly pollIntervalMs:    number;
  private readonly pollMaxAttempts:   number;
  private readonly skipStabilityPoll: boolean;
  private readonly dryRun:            boolean;

  constructor(private readonly configService: ConfigService) {
    this.client = new ECSClient({
      region:   configService.getOrThrow<string>('AWS_REGION'),
      endpoint: configService.get<string>('AWS_ENDPOINT_URL'),
      credentials: {
        accessKeyId:     configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.clusterName = configService.get<string>('ECS_CLUSTER_NAME', 'shipnexus-local');

    // Fix 2: validate numeric config values before use
    const rawPollInterval   = Number(configService.get('ECS_POLL_INTERVAL_MS', 15_000));
    const rawPollMaxAttempts = Number(configService.get('ECS_POLL_MAX_ATTEMPTS', 40));

    if (isNaN(rawPollInterval) || rawPollInterval <= 0) {
      throw new Error(
        `[EcsService] Invalid ECS_POLL_INTERVAL_MS: "${configService.get('ECS_POLL_INTERVAL_MS')}" — must be a positive number`,
      );
    }

    if (isNaN(rawPollMaxAttempts) || rawPollMaxAttempts <= 0) {
      throw new Error(
        `[EcsService] Invalid ECS_POLL_MAX_ATTEMPTS: "${configService.get('ECS_POLL_MAX_ATTEMPTS')}" — must be a positive number`,
      );
    }

    this.pollIntervalMs    = rawPollInterval;
    this.pollMaxAttempts   = rawPollMaxAttempts;
    this.skipStabilityPoll = configService.get<string>('ECS_SKIP_STABILITY_POLL', 'false') === 'true';
    this.dryRun            = configService.get<string>('ECS_DRY_RUN', 'false') === 'true';

    this.logger.log(
      `ECS client ready | cluster=${this.clusterName} | skipPoll=${this.skipStabilityPoll} | dryRun=${this.dryRun}`,
    );
  }

  async triggerDeployment(serviceName: string): Promise<void> {
    if (this.dryRun) {
      this.logger.warn(
        `[DRY-RUN] Skipping UpdateService for ${serviceName} — ` +
        `ECS_DRY_RUN=true (ECS requires LocalStack Pro or real AWS credentials)`,
      );
      return;
    }

    this.logger.log(
      `Triggering ECS deployment: cluster=${this.clusterName} service=${serviceName}`,
    );

    await this.client.send(
      new UpdateServiceCommand({
        cluster:            this.clusterName,
        service:            serviceName,
        forceNewDeployment: true,
      }),
    );

    this.logger.log(`UpdateService accepted for ${serviceName}`);
  }

  async waitForStability(serviceName: string): Promise<DeploymentResult> {
    if (this.skipStabilityPoll) {
      this.logger.log(
        `[LOCAL] Skipping stability poll for ${serviceName} — ECS_SKIP_STABILITY_POLL=true`,
      );
      return 'success';
    }

    this.logger.log(
      `Polling for stability: ${serviceName} ` +
      `(max ${this.pollMaxAttempts} attempts @ ${this.pollIntervalMs}ms)`,
    );

    for (let attempt = 1; attempt <= this.pollMaxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));

      // Fix 1: wrap DescribeServicesCommand in try-catch so transient
      // API errors consume a retry attempt instead of failing the job
      try {
        const response = await this.client.send(
          new DescribeServicesCommand({
            cluster:  this.clusterName,
            services: [serviceName],
          }),
        );

        const svc = response.services?.[0];

        if (!svc) {
          this.logger.error(
            `Service ${serviceName} not found in cluster ${this.clusterName}`,
          );
          return 'failed';
        }

        const deployments       = svc.deployments ?? [];
        const primaryDeployment = deployments.find((d) => d.status === 'PRIMARY');

        this.logger.log(
          `[${attempt}/${this.pollMaxAttempts}] ${serviceName} | ` +
          `rolloutState=${primaryDeployment?.rolloutState ?? 'UNKNOWN'} | ` +
          `running=${primaryDeployment?.runningCount ?? 0} | ` +
          `desired=${primaryDeployment?.desiredCount ?? 0} | ` +
          `deployments=${deployments.length}`,
        );

        if (primaryDeployment?.rolloutState === 'FAILED') {
          this.logger.error(
            `Deployment FAILED for ${serviceName} — ECS initiated rollback`,
          );
          return 'failed';
        }

        if (
          primaryDeployment?.rolloutState === 'COMPLETED' ||
          (primaryDeployment?.runningCount === primaryDeployment?.desiredCount &&
            primaryDeployment?.desiredCount! > 0 &&
            deployments.length === 1)
        ) {
          this.logger.log(`Service ${serviceName} reached stable state ✓`);
          return 'success';
        }
      } catch (err) {
        // Transient error — log and consume this attempt, do not throw
        this.logger.warn(
          `[${attempt}/${this.pollMaxAttempts}] Transient error polling ` +
          `${serviceName} — will retry`,
          err instanceof Error ? err.message : String(err),
        );
        // Continue to next attempt
      }
    }

    this.logger.warn(
      `Stability polling timed out for ${serviceName} after ${this.pollMaxAttempts} attempts`,
    );
    return 'timeout';
  }
}