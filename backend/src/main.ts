import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Set global prefix test
  app.setGlobalPrefix('api');

  // Enable CORS
  const corsOrigin = configService.get('CORS_ORIGIN');
  console.log('🔍 CORS Origin:', corsOrigin);

  // Debug environment variables
  console.log('🔍 Environment Variables:');
  console.log('NODE_ENV:', configService.get('NODE_ENV'));
  console.log('JWT_SECRET exists:', !!configService.get('JWT_SECRET'));
  console.log('JWT_EXPIRES_IN:', configService.get('JWT_EXPIRES_IN'));
  console.log('DATABASE_URL exists:', !!configService.get('DATABASE_URL'));

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE') || 'CrossFit Pro API')
    .setDescription(
      configService.get('SWAGGER_DESCRIPTION') ||
        'API for CrossFit Pro workout management application',
    )
    .setVersion(configService.get('SWAGGER_VERSION') || '1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(
    configService.get('SWAGGER_PATH') || 'api/docs',
    app,
    document,
  );

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger documentation: http://localhost:${port}/${configService.get('SWAGGER_PATH')}`,
  );
}
bootstrap();
