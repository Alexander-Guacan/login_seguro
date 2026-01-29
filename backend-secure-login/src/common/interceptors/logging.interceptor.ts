import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * LoggingInterceptor
 * - Auditoría de acciones
 * - Monitoreo de performance
 * - Debugging en desarrollo
 * - Análisis de uso
 * 
 * Logs incluyen:
 * - Método HTTP
 * - URL
 * - Usuario (si está autenticado)
 * - IP del cliente
 * - Tiempo de respuesta
 * - Status code
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const user = (request as any).user;

    // Marca de tiempo de inicio
    const now = Date.now();

    // Log de request entrante
    this.logger.log(
      `→ ${method} ${url} - IP: ${ip} - User: ${user?.email || 'anonymous'}`,
    );

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          // Log de response exitoso
          const { statusCode } = response;
          const responseTime = Date.now() - now;
          
          this.logger.log(
            `← ${method} ${url} - ${statusCode} - ${responseTime}ms - User: ${user?.email || 'anonymous'}`,
          );

          // Log detallado solo en desarrollo
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug({
              method,
              url,
              statusCode,
              responseTime: `${responseTime}ms`,
              userAgent,
              user: user?.email || 'anonymous',
              ip,
            });
          }
        },
        error: (error: any) => {
          // Log de error
          const responseTime = Date.now() - now;
          const statusCode = error?.status || 500;
          
          this.logger.error(
            `✗ ${method} ${url} - ${statusCode} - ${responseTime}ms - User: ${user?.email || 'anonymous'}`,
          );
        },
      }),
    );
  }
}