import { Module }          from '@nestjs/common';
import { ConfigModule }    from '@nestjs/config';
import { AppController }   from './app.controller';
import { AppService }      from './app.service';
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
  controllers: [AppController],
  providers:   [AppService],
})
export class AppModule {}