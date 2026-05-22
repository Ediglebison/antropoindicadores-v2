import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
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
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return token if credentials are valid', async () => {
      const loginDto = { access_code: '123', password: 'password123' };
      const user = { id: '1', access_code: '123', role: 'ADMIN' };
      const tokenResult = { access_token: 'jwt-token' };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(tokenResult);

      const result = await controller.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.access_code, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(tokenResult);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = { access_code: '123', password: 'wrongpassword' };
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.access_code, loginDto.password);
      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});
