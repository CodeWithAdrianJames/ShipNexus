import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { SqsModule } from '../sqs/sqs.module';
import { GithubWebhookGuard } from './guards/github-webhook.guard';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';

@Module({
  imports: [SqsModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, GithubWebhookGuard, InternalApiKeyGuard],
})
export class DeploymentsModule {}
