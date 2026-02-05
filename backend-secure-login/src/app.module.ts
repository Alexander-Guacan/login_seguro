import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';
import { UsersModule } from './users/users.module';
import { BiometricModule } from './biometric/biometric.module';

/**
 * Configuración:
 * - Rate Limiting: 10 requests por minuto por IP (configurable)
 * - Guards globales: JWT y Roles
 * - Filters globales: HTTP y Prisma exceptions
 * - Interceptors globales: Logging
 */
@Module({
  imports: [
    // Rate Limiting - Protección contra brute force
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000, // 60 segundos
        limit: parseInt(process.env.THROTTLE_LIMIT || '10'), // 10 requests
      },
    ]),
    
    // Módulos de la aplicación
    PrismaModule,
    AuthModule,
    UsersModule,
    BiometricModule
  ],
  providers: [
    // Guard para rate limiting (se aplica antes que los demás)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Guard global para JWT (protege todos los endpoints excepto @Public)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Guard global para Roles (verifica permisos después de JWT)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Filter para excepciones HTTP
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Filter para excepciones de Prisma
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    // Interceptor para logging de requests/responses
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}