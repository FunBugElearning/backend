import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The frontend's graphqlRequest() sends `credentials: "include"`, so the
  // browser requires an explicit origin (not `*`) plus `credentials: true`
  // here, or every request is blocked by CORS before it reaches the server.
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

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
