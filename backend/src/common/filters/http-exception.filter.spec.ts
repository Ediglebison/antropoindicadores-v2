import { GlobalExceptionFilter } from './http-exception.filter';
import { BadRequestException, HttpException } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  function mockArgumentsHost() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const getResponse = jest.fn().mockReturnValue({ status });
    const getRequest = jest.fn().mockReturnValue({ url: '/test' });
    const switchToHttp = jest.fn().mockReturnValue({ getResponse, getRequest });

    return {
      switchToHttp,
      getResponse,
      getRequest,
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
    } as any;
  }

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  describe('Good — HttpException com string', () => {
    it('deve retornar status 400 e message para BadRequestException com string', () => {
      const host = mockArgumentsHost();
      const exception = new BadRequestException('x');

      filter.catch(exception, host);

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.status().json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'x',
        }),
      );
    });

    it('deve incluir timestamp e path na resposta', () => {
      const host = mockArgumentsHost();
      const exception = new BadRequestException('x');

      filter.catch(exception, host);

      const response = host.switchToHttp().getResponse();
      expect(response.status().json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
          path: '/test',
        }),
      );
    });

    it('deve extrair primeiro item de array message', () => {
      const host = mockArgumentsHost();
      const exception = new HttpException({ message: ['erro1', 'erro2'] }, 422);

      filter.catch(exception, host);

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(422);
      expect(response.status().json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 422,
          message: 'erro1',
        }),
      );
    });
  });

  describe('Bad — Erro não-Http', () => {
    it('deve retornar 500 e mensagem genérica para Error comum', () => {
      const host = mockArgumentsHost();
      const exception = new Error('db crash');

      filter.catch(exception, host);

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.status().json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Erro interno do servidor',
        }),
      );
    });
  });

  describe('Ugly — Undefined', () => {
    it('deve retornar 500 para exception undefined', () => {
      const host = mockArgumentsHost();

      filter.catch(undefined, host);

      const response = host.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.status().json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Erro interno do servidor',
        }),
      );
    });
  });
});
