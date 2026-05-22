import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOneByCode: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password_hash if valid', async () => {
      const mockUser = { id: '1', access_code: 'USER1', password_hash: 'hashed', role: 'ADMIN' };
      mockUsersService.findOneByCode.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('USER1', 'password');

      expect(usersService.findOneByCode).toHaveBeenCalledWith('USER1');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed');
      expect(result).toEqual({ id: '1', access_code: 'USER1', role: 'ADMIN' });
    });

    it('should return null if password mismatch', async () => {
      const mockUser = { id: '1', access_code: 'USER1', password_hash: 'hashed', role: 'ADMIN' };
      mockUsersService.findOneByCode.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('USER1', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOneByCode.mockResolvedValue(null);

      const result = await service.validateUser('USER1', 'password');

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access_token and user info', async () => {
      const mockUser = { id: '1', name: 'Test User', access_code: 'USER1', role: 'ADMIN' };
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'USER1',
        sub: '1',
        role: 'ADMIN',
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: '1',
          name: 'Test User',
          access_code: 'USER1',
          role: 'ADMIN'
        }
      });
    });
  });
});
