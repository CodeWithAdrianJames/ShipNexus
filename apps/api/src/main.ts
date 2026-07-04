import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000, '0.0.0.0');
}
void bootstrap();
