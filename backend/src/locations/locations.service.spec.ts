import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('LocationsService', () => {
  let service: LocationsService;
  let repository: Repository<Location>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getRepositoryToken(Location),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    repository = module.get<Repository<Location>>(getRepositoryToken(Location));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new location with generated id', async () => {
      const data = { name: 'Loc 1', code: 'L1' };
      const expectedLocation = { id: 'mocked-timestamp', ...data };
      mockRepository.create.mockReturnValue(expectedLocation);
      mockRepository.save.mockResolvedValue(expectedLocation);

      jest.spyOn(Date, 'now').mockReturnValue(1234567890); // Mock Date.now

      const result = await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith({ id: '1234567890', name: 'Loc 1', code: 'L1' });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedLocation);
      
      jest.restoreAllMocks();
    });

    it('should throw ConflictException on duplicate code', async () => {
      mockRepository.create.mockReturnValue({ name: 'Loc 1', code: 'L1' });
      mockRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create({ name: 'Loc 1', code: 'L1' })).rejects.toThrow(ConflictException);
    });

    it('should throw original error if not duplicate code', async () => {
      mockRepository.create.mockReturnValue({ name: 'Loc 1', code: 'L1' });
      const error = new Error('Other error');
      mockRepository.save.mockRejectedValue(error);

      // spy console error to keep output clean
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.create({ name: 'Loc 1', code: 'L1' })).rejects.toThrow('Other error');

      consoleSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should return all locations', async () => {
      const locations = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(locations);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual(locations);
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      const location = { id: '1' };
      mockRepository.findOne.mockResolvedValue(location);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(location);
    });
  });

  describe('update', () => {
    it('should update and return the location', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      const location = { id: '1', name: 'Updated' };
      mockRepository.findOne.mockResolvedValue(location);

      const result = await service.update('1', { name: 'Updated' });

      expect(mockRepository.update).toHaveBeenCalledWith('1', { name: 'Updated' });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(location);
    });
  });

  describe('remove', () => {
    it('should delete the location', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
