import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  // Header keamanan HTTP (XSS filter, frameguard, HSTS, dsb.).
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? '*',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  console.log(`🚀 PantauSiswa API running at http://localhost:${port}/api`);
}
bootstrap();
