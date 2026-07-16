import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

const logger = new Logger('Bootstrap');

function getCorsOrigins() {
  return (
    process.env.CORS_ORIGINS ??
    process.env.DASHBOARD_ORIGIN ??
    'http://localhost:3001,http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  // rawBody: true buffers the exact request bytes onto req.rawBody
  // BEFORE the JSON middleware parses them. Both are available simultaneously.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Allow the Next.js dashboard to call the API from the browser
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-hub-signature-256',
    ],
    credentials: true,
  });

  // TODO: Configure an application-specific CSP before production launch.
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  logger.error(
    'API failed to start',
    err instanceof Error ? err.stack : String(err),
  );
  process.exit(1);
});
