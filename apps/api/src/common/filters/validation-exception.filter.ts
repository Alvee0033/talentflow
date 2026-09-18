import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();
    
    let errors = exceptionResponse;
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      errors = exceptionResponse.message.map((msg: string) => ({ message: msg }));
    }

    response
      .status(status)
      .json({
        success: false,
        errors,
        statusCode: status,
        timestamp: new Date().toISOString(),
      });
  }
}
