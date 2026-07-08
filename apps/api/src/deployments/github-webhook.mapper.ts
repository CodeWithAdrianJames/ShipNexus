import { BadRequestException } from '@nestjs/common';
import { CreateDeploymentDto } from './dto/create-deployment.dto';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readString(source: JsonObject, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function environmentFromRef(ref: string): CreateDeploymentDto['environment'] {
  if (ref === 'refs/heads/main' || ref === 'refs/heads/master') {
    return 'production';
  }

  if (ref === 'refs/heads/develop' || ref === 'refs/heads/development') {
    return 'development';
  }

  return 'staging';
}

export function mapGithubWebhookToDeployment(
  event: string,
  deliveryId: string | undefined,
  payload: unknown,
): CreateDeploymentDto | null {
  if (event === 'ping') {
    return null;
  }

  if (event !== 'push') {
    throw new BadRequestException(`Unsupported GitHub event: ${event}`);
  }

  const body = asObject(payload);
  const repository = asObject(body.repository);
  const pusher = asObject(body.pusher);
  const sender = asObject(body.sender);

  const serviceName = readString(repository, 'name');
  const imageTag = readString(body, 'after');
  const ref = readString(body, 'ref');
  const triggeredBy = readString(pusher, 'name') ?? readString(sender, 'login');

  if (!serviceName) {
    throw new BadRequestException('GitHub push payload missing repository.name');
  }

  if (!imageTag) {
    throw new BadRequestException('GitHub push payload missing after SHA');
  }

  if (!ref) {
    throw new BadRequestException('GitHub push payload missing ref');
  }

  if (!triggeredBy) {
    throw new BadRequestException(
      'GitHub push payload missing pusher.name or sender.login',
    );
  }

  return {
    serviceName,
    imageTag,
    environment: environmentFromRef(ref),
    triggeredBy,
    webhookEventId: deliveryId,
    payload: body,
  };
}
