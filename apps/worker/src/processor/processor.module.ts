import { Module }            from '@nestjs/common';
import { ProcessorService }  from './processor.service';
import { LockModule }        from '../lock/lock.module';

@Module({
  imports:   [LockModule],
  providers: [ProcessorService],
})
export class ProcessorModule {}