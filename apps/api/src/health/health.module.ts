import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '../database/database.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
