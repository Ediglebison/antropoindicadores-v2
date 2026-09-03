import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const VALIDATION_MESSAGES: Record<string, string> = {
  'should not be empty': 'Dados inválidos',
  'must be a string': 'Dados inválidos',
  'should not exist': 'Dados inválidos',
  'must be an enum': 'Dados inválidos',
  'must be a number': 'Dados inválidos',
  'must be a boolean': 'Dados inválidos',
  'must be a valid date': 'Dados inválidos',
  'must be an email': 'Dados inválidos',
  'is too short': 'Dados inválidos',
  'is too long': 'Dados inválidos',
};

function sanitizeValidationMessage(msg: string): string {
  for (const [pattern, replacement] of Object.entries(VALIDATION_MESSAGES)) {
    if (msg.includes(pattern)) return replacement;
  }
  return msg;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        const raw = Array.isArray(resp.message)
          ? resp.message[0]
          : resp.message || message;
        message = this.isProduction ? sanitizeValidationMessage(raw) : raw;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const body: Record<string, any> = { statusCode: status, message };

    if (!this.isProduction) {
      body.timestamp = new Date().toISOString();
      body.path = request.url;
    }

    response.status(status).json(body);
  }
}
