import { Module }          from '@nestjs/common';
import { ConfigModule }    from '@nestjs/config';
import { DatabaseModule }  from './database/database.module';
import { LockModule }      from './lock/lock.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    LockModule,
    ProcessorModule,
  ],
})
export class AppModule {}