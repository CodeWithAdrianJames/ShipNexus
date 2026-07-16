import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = req.headers['x-internal-api-key'];
    const expectedApiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || typeof apiKey !== 'string') {
      this.logger.warn(
        `Rejected request from ${req.ip} — missing x-internal-api-key header`,
      );
      throw new UnauthorizedException('Missing x-internal-api-key header');
    }

    if (!expectedApiKey) {
      this.logger.error('INTERNAL_API_KEY is not configured');
      throw new UnauthorizedException('Invalid internal API key');
    }

    const apiKeyBuffer = Buffer.from(apiKey);
    const expectedApiKeyBuffer = Buffer.from(expectedApiKey);

    if (apiKeyBuffer.length !== expectedApiKeyBuffer.length) {
      this.logger.warn(
        `Rejected request from ${req.ip} — API key length mismatch`,
      );
      throw new UnauthorizedException('Invalid internal API key');
    }

    const isValid = timingSafeEqual(apiKeyBuffer, expectedApiKeyBuffer);

    if (!isValid) {
      this.logger.warn(`Rejected request from ${req.ip} — API key mismatch`);
      throw new UnauthorizedException('Invalid internal API key');
    }

    this.logger.log(`Internal API key verified for request from ${req.ip}`);
    return true;
  }
}
