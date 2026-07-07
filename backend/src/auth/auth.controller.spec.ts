import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RolesGuard } from './roles.guard';
import request from 'supertest';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return user data if credentials are valid', async () => {
      const loginDto = { access_code: '123', password: 'password123' };
      const user = { id: '1', access_code: '123', role: 'ADMIN' };
      const loginResult = {
        user: { id: '1', name: 'Test', access_code: '123', role: 'ADMIN' },
      };
      const res = mockResponse();

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockReturnValue(loginResult);

      const result = await controller.login(loginDto, res);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.access_code,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(user, res);
      expect(result).toEqual(loginResult);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = { access_code: '123', password: 'wrongpassword' };
      const res = mockResponse();

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto, res)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.access_code,
        loginDto.password,
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('should return authenticated user data', async () => {
      const req = { user: { userId: '1', username: 'USER1', role: 'ADMIN' } };

      const result = await controller.me(req as any);

      expect(result).toEqual({
        id: '1',
        username: 'USER1',
        role: 'ADMIN',
      });
    });
  });

  describe('logout', () => {
    it('should clear cookie and return message', async () => {
      const res = mockResponse();

      const result = await controller.logout(res);

      expect(res.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(result).toEqual({ message: 'Sessão encerrada' });
    });
  });
});

describe('rate limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'login', ttl: 60000, limit: 5 }]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn().mockResolvedValue(null),
            login: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 429 after 5 failed login attempts in 1 minute', async () => {
    const body = { access_code: 'invalid', password: 'invalid' };

    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(body);
      expect(res.status).toBe(401);
    }

    const sixth = await request(app.getHttpServer())
      .post('/auth/login')
      .send(body);
    expect(sixth.status).toBe(429);
  });
});
