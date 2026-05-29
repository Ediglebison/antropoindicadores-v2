import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    update: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    hashPassword: jest.fn(),
    createAdminBypass: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    process.env.SETUP_TOKEN = 'test-token';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update', () => {
    it('should update a user', async () => {
      const id = '1';
      const updateUserDto = { name: 'Test', is_active: true };
      const expectedResult = { id, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(id, {
        name: 'Test',
        access_code: undefined,
        role: undefined,
        password: undefined,
        is_active: true,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = [{ id: '1', name: 'Test' }];
      mockUsersService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        name: 'Test',
        access_code: '123',
        password: 'pass',
        role: UserRole.RESEARCHER,
        is_active: true,
      };
      mockUsersService.hashPassword.mockResolvedValue('hashed-pass');
      mockUsersService.create.mockResolvedValue({
        id: '1',
        ...createUserDto,
        password_hash: 'hashed-pass',
      });

      await controller.create(createUserDto);

      expect(mockUsersService.hashPassword).toHaveBeenCalledWith('pass');
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Test',
        access_code: '123',
        password_hash: 'hashed-pass',
        role: UserRole.RESEARCHER,
        is_active: true,
      });
    });

    it('should use default values for role and is_active if not provided', async () => {
      const createUserDto = {
        name: 'Test',
        access_code: '123',
        password: 'pass',
      };
      mockUsersService.hashPassword.mockResolvedValue('hashed-pass');
      mockUsersService.create.mockResolvedValue({
        id: '1',
        ...createUserDto,
        password_hash: 'hashed-pass',
        role: UserRole.RESEARCHER,
        is_active: true,
      });

      await controller.create(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Test',
        access_code: '123',
        password_hash: 'hashed-pass',
        role: UserRole.RESEARCHER,
        is_active: true,
      });
    });
  });

  describe('setupAdmin', () => {
    it('should create admin bypass when token is valid', async () => {
      const createUserDto = {
        name: 'Admin',
        access_code: 'admin',
        password: 'pass',
        role: UserRole.ADMIN,
      };
      mockUsersService.createAdminBypass.mockResolvedValue({
        id: '1',
        ...createUserDto,
      });

      const result = await controller.setupAdmin(createUserDto, 'test-token');

      expect(mockUsersService.createAdminBypass).toHaveBeenCalledWith(
        createUserDto,
      );
      expect(result).toEqual({ id: '1', ...createUserDto });
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const createUserDto = {
        name: 'Admin',
        access_code: 'admin',
        password: 'pass',
        role: UserRole.ADMIN,
      };

      await expect(
        controller.setupAdmin(createUserDto as any, 'wrong-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const id = '1';
      mockUsersService.remove.mockResolvedValue({ affected: 1 });

      expect(await controller.remove(id)).toEqual({ affected: 1 });
      expect(mockUsersService.remove).toHaveBeenCalledWith(id);
    });
  });
});
