import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces/nest-express-application.interface';

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
  
  /*
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  */
 const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

   app.useStaticAssets(join(__dirname, '..', 'src', 'public'), {
    prefix: '/',
  });

  // Helmet - Headers de seguridad HTTP
  app.use(helmet.default());
  
  // CORS - Configuración para frontend
  app.enableCors({
    origin: [
      /*process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://127.0.0.1:5500',
      'http://localhost:5500'*/
      'http://localhost:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://6c56-200-50-232-234.ngrok-free.app',
      process.env.FRONTEND_URL || 'http://192.168.56.1:5500',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization','ngrok-skip-browser-warning'],
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
  //await app.listen(port);
  await app.listen(port,'0.0.0.0')

  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.log(`Network: http://${getLocalIP()}:${port}/api`);
}



function getLocalIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 y no loopback
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

bootstrap();