import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Interface para el formato de respuesta de error
 */
interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
}

/**
 * HttpExceptionFilter
 * - Respuestas de error consistentes en toda la aplicación
 * - Logging centralizado de errores
 * - Sanitización de errores (no expone stack traces en producción)
 * - Mejor experiencia de debugging en desarrollo
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extraer el mensaje del error
    const message = this.extractMessage(exceptionResponse);

    // Construir respuesta de error
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // Agregar nombre del error solo si no es producción
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error = exception.name;
    }

    // Log del error con diferentes niveles según el status code
    this.logError(request, status, message, exception);

    // Enviar respuesta
    response.status(status).json(errorResponse);
  }

  /**
   * Extrae el mensaje de error de la respuesta de la excepción
   */
  private extractMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      return exceptionResponse.message as string | string[];
    }

    return 'Error interno del servidor';
  }

  /**
   * Realiza logging del error con el nivel apropiado
   */
  private logError(
    request: Request,
    status: number,
    message: string | string[],
    exception: HttpException,
  ) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      statusCode: status,
      message,
      user: (request as any).user?.email || 'anonymous',
      ip: request.ip,
    };

    // Errores del servidor (5xx) se loggean como error
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Server Error: ${JSON.stringify(errorLog)}`,
        exception.stack,
      );
    }
    // Errores del cliente (4xx) se loggean como warning
    else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(`Client Error: ${JSON.stringify(errorLog)}`);
    }
    // Otros se loggean como debug
    else {
      this.logger.debug(`HTTP Exception: ${JSON.stringify(errorLog)}`);
    }
  }
}