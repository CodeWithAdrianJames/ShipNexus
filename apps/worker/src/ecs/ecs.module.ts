import { Module } from '@nestjs/common';
import { EcsService } from './ecs.service';

@Module({
  providers: [EcsService],
  exports: [EcsService],
})
export class EcsModule {}
