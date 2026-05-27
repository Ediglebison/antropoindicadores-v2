import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './user.entity';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.hashPassword('password');

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 'salt');
      expect(result).toEqual('hashed_password');
    });
  });

  describe('createAdminBypass', () => {
    it('should create an admin user', async () => {
      const body = { name: 'Admin', access_code: 'admin1', password: 'pass' };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pass');
      
      const expectedUser = { ...body, access_code: 'ADMIN1', password_hash: 'hashed_pass', role: UserRole.ADMIN };
      mockRepository.create.mockReturnValue(expectedUser);
      mockRepository.save.mockResolvedValue({ id: '1', ...expectedUser });

      const result = await service.createAdminBypass(body);

      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Admin',
        access_code: 'ADMIN1',
        password_hash: 'hashed_pass',
        role: UserRole.ADMIN,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
    });
  });

  describe('findOneByCode', () => {
    it('should return a user by uppercase code', async () => {
      const user = { id: '1', access_code: 'CODE1' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneByCode('code1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { access_code: 'CODE1' } });
      expect(result).toEqual(user);
    });
  });

  describe('findOneById', () => {
    it('should return a user by id', async () => {
      const user = { id: '1' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneById('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: '1' }, { id: '2' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const dto = { name: 'User', access_code: 'usr' };
      const createdUser = { ...dto, access_code: 'USR' };
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue({ id: '1', ...createdUser });

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'User', access_code: 'USR' });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
    });

    it('should throw ConflictException on duplicate code', async () => {
      mockRepository.save.mockRejectedValue({ code: '23505' });
      mockRepository.create.mockReturnValue({ access_code: 'USR' });

      await expect(service.create({ access_code: 'usr' })).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on other db errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Unexpected error'));
      mockRepository.create.mockReturnValue({ access_code: 'USR' });

      await expect(service.create({ access_code: 'usr' })).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update user without password', async () => {
      const user = { id: '1', access_code: 'USER1' };
      // First findOneById call (validation)
      mockRepository.findOne.mockResolvedValueOnce(user);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      // Second findOneById call (return updated)
      const updatedUser = { id: '1', access_code: 'USER2' };
      mockRepository.findOne.mockResolvedValueOnce(updatedUser);

      const result = await service.update('1', { access_code: 'USER2' });

      expect(mockRepository.update).toHaveBeenCalledWith('1', { access_code: 'USER2' });
      expect(result).toEqual(updatedUser);
    });

    it('should update user and hash password if provided', async () => {
      const user = { id: '1', access_code: 'USER1' };
      mockRepository.findOne.mockResolvedValueOnce(user);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      const updatedUser = { id: '1', access_code: 'USER1', password_hash: 'hashed_new' };
      mockRepository.findOne.mockResolvedValueOnce(updatedUser);

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new');

      const result = await service.update('1', { password: 'new_password' } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 'salt');
      expect(mockRepository.update).toHaveBeenCalledWith('1', { password_hash: 'hashed_new' });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found to update', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.update('1', { name: 'test' })).rejects.toThrow('Usuário não encontrado');
    });
  });
});
