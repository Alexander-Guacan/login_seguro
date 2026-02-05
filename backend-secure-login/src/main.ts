import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as helmet from 'helmet';

/**
 * Configura e inicia la aplicación NestJS con todas las medidas de seguridad.
 * 
 * Seguridad implementada:
 * - Helmet: Headers de seguridad (XSS, clickjacking, etc.)
 * - CORS: Control de orígenes permitidos
 * - ValidationPipe: Validación automática de DTOs
 * - Global prefix: /api para todas las rutas
 
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Helmet - Headers de seguridad HTTP
  app.use(helmet.default());
  
  // CORS - Configuración para frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  

  app.useGlobalPipes(
    new ValidationPipe({
      // Transformar payloads a instancias de DTO
      transform: true,
      // Remover propiedades que no están en el DTO
      whitelist: true,
      // Lanzar error si hay propiedades extras
      forbidNonWhitelisted: true,
      // Transformar tipos primitivos
      transformOptions: {
        enableImplicitConversion: true,
      },

      errorHttpStatusCode: 400,
      // Deshabilitar mensajes de error detallados en producción
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
}

bootstrap();