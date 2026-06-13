import { NestFactory } from '@nestjs/core';
import { AppModule }   from './app.module';
import { Logger }      from '@nestjs/common';

async function bootstrap() {
  const app    = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');

  app.enableShutdownHooks();
  logger.log('ShipNexus Worker is running');
}
bootstrap();