import { NestFactory }   from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule }      from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:        true,  // strip unknown properties
      forbidNonWhitelisted: true,  // reject requests with unknown properties
      transform:        true,  // auto-transform payloads to DTO instances
    }),
  );

  await app.listen(3000, '0.0.0.0');
}
bootstrap();