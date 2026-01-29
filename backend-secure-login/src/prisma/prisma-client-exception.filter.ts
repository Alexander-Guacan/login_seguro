import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@generated/prisma/client';
import { Response } from 'express';

/**
 * PrismaClientExceptionFilter
 * 
 * Filtro global para manejar excepciones de Prisma y convertirlas
 * en respuestas HTTP apropiadas sin exponer detalles internos.
 * 
 * Esto es crucial para seguridad: no queremos revelar estructura de BD
 * o detalles de errores al cliente.
 * 
 * Principios SOLID:
 * - Single Responsibility: Solo maneja errores de Prisma
 * - Open/Closed: Podemos extender para más tipos de error sin modificar
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Log del error completo para debugging (solo servidor)
    this.logger.error(
      `Prisma error: ${exception.code} - ${exception.message}`,
      exception.stack,
    );

    // Mapeo de códigos de error de Prisma a respuestas HTTP
    const errorMap: Record<string, { status: HttpStatus; message: string }> = {
      P2000: {
        status: HttpStatus.BAD_REQUEST,
        message: 'El valor proporcionado es demasiado largo para el campo',
      },
      P2001: {
        status: HttpStatus.NOT_FOUND,
        message: 'El registro buscado no existe',
      },
      P2002: {
        status: HttpStatus.CONFLICT,
        message: 'Ya existe un registro con ese valor único',
      },
      P2003: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Restricción de clave foránea fallida',
      },
      P2025: {
        status: HttpStatus.NOT_FOUND,
        message: 'Registro no encontrado',
      },
    };

    const error = errorMap[exception.code] || {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrió un error en la base de datos',
    };

    // Extraer información adicional para algunos casos específicos
    let enhancedMessage = error.message;
    
    if (exception.code === 'P2002' && exception.meta?.target) {
      const fields = (exception.meta.target as string[]).join(', ');
      enhancedMessage = `El campo ${fields} ya está en uso`;
    }

    response.status(error.status).json({
      statusCode: error.status,
      message: enhancedMessage,
      error: this.getErrorName(error.status),
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorName(status: HttpStatus): string {
    const errorNames: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };

    return errorNames[status] || 'Error';
  }
}