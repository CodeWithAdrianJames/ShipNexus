import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LockModule } from './lock/lock.module';
import { EcsModule } from './ecs/ecs.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_ENDPOINT_URL: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        SQS_QUEUE_NAME: Joi.string().required(),
        SQS_VISIBILITY_TIMEOUT: Joi.number().greater(0).required(),
        SQS_WAIT_TIME_SECONDS: Joi.number().greater(0).required(),
      }).unknown(true),
    }),
    DatabaseModule,
    LockModule,
    EcsModule,
    ProcessorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
