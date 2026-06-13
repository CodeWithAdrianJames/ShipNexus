import { Module }                from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService }    from './deployments.service';
import { SqsModule }             from '../sqs/sqs.module';

@Module({
  imports:     [SqsModule],
  controllers: [DeploymentsController],
  providers:   [DeploymentsService],
})
export class DeploymentsModule {}