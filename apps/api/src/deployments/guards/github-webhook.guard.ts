import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class GithubWebhookGuard implements CanActivate {
  private readonly logger = new Logger(GithubWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // --- 1. Extract the signature header ---
    const signature = req.headers['x-hub-signature-256'];

    if (!signature || typeof signature !== 'string') {
      this.logger.warn(
        `Rejected request from ${req.ip} — missing x-hub-signature-256 header`,
      );
      throw new UnauthorizedException('Missing x-hub-signature-256 header');
    }

    // --- 2. Extract raw body (populated by NestJS rawBody: true) ---
    const rawBody = req.rawBody;

    if (!rawBody || rawBody.length === 0) {
      this.logger.warn(`Rejected request — empty or missing raw body`);
      throw new UnauthorizedException('Empty request body');
    }

    // --- 3. Load the shared secret ---
    const secret = this.configService.getOrThrow<string>(
      'GITHUB_WEBHOOK_SECRET',
    );

    // --- 4. Compute expected HMAC-SHA256 over the raw bytes ---
    const expectedSignature =
      'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

    // --- 5. Constant-time comparison — prevents timing attacks ---
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    // Length mismatch is not secret information — safe to check directly.
    // timingSafeEqual requires equal-length buffers.
    if (sigBuffer.length !== expectedBuffer.length) {
      this.logger.warn(
        `Rejected request from ${req.ip} — signature length mismatch`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const isValid = timingSafeEqual(sigBuffer, expectedBuffer);

    if (!isValid) {
      this.logger.warn(`Rejected request from ${req.ip} — signature mismatch`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Webhook signature verified for request from ${req.ip}`);
    return true;
  }
}
