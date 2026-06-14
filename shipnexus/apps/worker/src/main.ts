import { NestFactory } from '@nestjs/core';
import { AppModule }   from './app.module';
import { Logger }      from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  logger.log('ShipNexus Worker is running');
}

bootstrap().catch((err: unknown) => {
  logger.error(
    'Worker failed to start',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});