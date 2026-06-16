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
  private readonly clusterName:      string;
  private readonly pollIntervalMs:   number;
  private readonly pollMaxAttempts:  number;
  private readonly skipStabilityPoll: boolean;

  constructor(private readonly configService: ConfigService) {
    this.client = new ECSClient({
      region:   configService.getOrThrow<string>('AWS_REGION'),
      // Omitting endpoint in production points the SDK at real AWS
      endpoint: configService.get<string>('AWS_ENDPOINT_URL'),
      credentials: {
        accessKeyId:     configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.clusterName       = configService.get<string>('ECS_CLUSTER_NAME', 'shipnexus-local');
    this.pollIntervalMs    = Number(configService.get('ECS_POLL_INTERVAL_MS', 15_000));
    this.pollMaxAttempts   = Number(configService.get('ECS_POLL_MAX_ATTEMPTS', 40));
    this.skipStabilityPoll = configService.get<string>('ECS_SKIP_STABILITY_POLL', 'false') === 'true';

    this.logger.log(
      `ECS client ready | cluster=${this.clusterName} | skipPoll=${this.skipStabilityPoll}`,
    );
  }

  /**
   * Forces a new ECS deployment for the given service.
   * This is equivalent to clicking "Force new deployment" in the AWS console.
   */
  async triggerDeployment(serviceName: string): Promise<void> {
  const dryRun = this.configService.get<string>('ECS_DRY_RUN', 'false') === 'true';

  if (dryRun) {
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

  /**
   * Polls DescribeServices until the PRIMARY deployment reaches a terminal
   * state (COMPLETED or FAILED), or until max attempts are exhausted.
   *
   * In local dev (ECS_SKIP_STABILITY_POLL=true), returns 'success' immediately
   * after UpdateService is accepted — LocalStack doesn't cycle task states.
   */
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

      const response = await this.client.send(
        new DescribeServicesCommand({
          cluster:  this.clusterName,
          services: [serviceName],
        }),
      );

      const service = response.services?.[0];

      if (!service) {
        this.logger.error(
          `Service ${serviceName} not found in cluster ${this.clusterName}`,
        );
        return 'failed';
      }

      const deployments      = service.deployments ?? [];
      const primaryDeployment = deployments.find((d) => d.status === 'PRIMARY');

      this.logger.log(
        `[${attempt}/${this.pollMaxAttempts}] ${serviceName} | ` +
        `rolloutState=${primaryDeployment?.rolloutState ?? 'UNKNOWN'} | ` +
        `running=${primaryDeployment?.runningCount ?? 0} | ` +
        `desired=${primaryDeployment?.desiredCount ?? 0} | ` +
        `deployments=${deployments.length}`,
      );

      // Terminal failure state — ECS rolled back the deployment
      if (primaryDeployment?.rolloutState === 'FAILED') {
        this.logger.error(
          `Deployment FAILED for ${serviceName} — ECS initiated rollback`,
        );
        return 'failed';
      }

      // Terminal success: rollout completed OR single deployment with matching counts
      if (
        primaryDeployment?.rolloutState === 'COMPLETED' ||
        (primaryDeployment?.runningCount === primaryDeployment?.desiredCount &&
          primaryDeployment?.desiredCount! > 0 &&
          deployments.length === 1)
      ) {
        this.logger.log(`Service ${serviceName} reached stable state ✓`);
        return 'success';
      }
    }

    this.logger.warn(
      `Stability polling timed out for ${serviceName} after ${this.pollMaxAttempts} attempts`,
    );
    return 'timeout';
  }
}