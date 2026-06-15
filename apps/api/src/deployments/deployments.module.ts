import { Module }                from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService }    from './deployments.service';
import { SqsModule }             from '../sqs/sqs.module';
import { GithubWebhookGuard }    from './guards/github-webhook.guard';

@Module({
  imports:     [SqsModule],
  controllers: [DeploymentsController],
  providers:   [DeploymentsService, GithubWebhookGuard],
})
export class DeploymentsModule {}