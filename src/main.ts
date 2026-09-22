import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Default Express json body limit (100kb) is too small for the
  // uploadImage mutation's base64-encoded image payloads.
  app.use(json({ limit: '10mb' }));

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  console.log('CORS origins:', corsOrigins);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // No `whitelist: true`: many existing DTOs across the app (LoginAuthInput,
  // CreateUserInput, assignment/attendance inputs, etc.) have fields with no
  // class-validator decorators at all. Whitelisting would silently strip
  // those fields from every request until every DTO is audited and
  // decorated — a much larger change than this one. This just activates the
  // `class-validator` decorators that already exist (and were previously
  // inert with no pipe registered at all).
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
