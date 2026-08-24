import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Trust only the immediate proxy's X-Forwarded-* headers (set the real
    // count/CIDR for your infra) so req.ip reflects the real client IP for
    // rate limiting/audit logs without letting a spoofed header bypass it.
    cors: false, // configured explicitly below instead of the default permissive one
    // Disabled so we can raise the body size limit below — Nest's default
    // body parser caps requests at ~100kb, too small for a CSV import of a
    // few hundred/thousand accounts or prospects sent as a JSON string.
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));
  app.use(helmet());
  app.use(cookieParser());

  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true, // required so the refresh-token cookie is sent/received
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not declared on the DTO
      forbidNonWhitelisted: true, // rejects requests that include them, instead of silently dropping
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`Comitai backend listening on port ${port}`);
}

bootstrap();
