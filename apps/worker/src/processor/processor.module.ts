import { Module } from '@nestjs/common';
import { ProcessorService } from './processor.service';
import { LockModule } from '../lock/lock.module';
import { EcsModule } from '../ecs/ecs.module';

@Module({
  imports: [LockModule, EcsModule],
  providers: [ProcessorService],
})
export class ProcessorModule {}
