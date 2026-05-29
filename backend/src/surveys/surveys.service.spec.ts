import { Test, TestingModule } from '@nestjs/testing';
import { SurveysService } from './surveys.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey } from './entities/survey.entity';

describe('SurveysService', () => {
  let service: SurveysService;

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
        SurveysService,
        {
          provide: getRepositoryToken(Survey),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SurveysService>(SurveysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a survey', async () => {
      const dto = { title: 'Survey 1', description: 'Desc' };
      const expectedSurvey = { id: '123', ...dto };
      mockRepository.create.mockReturnValue({ ...dto });
      mockRepository.save.mockResolvedValue(expectedSurvey);

      jest.spyOn(Date, 'now').mockReturnValue(123);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedSurvey);

      jest.restoreAllMocks();
    });
  });

  describe('findAll', () => {
    it('should return all surveys ordered by created_at', async () => {
      const surveys = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(surveys);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(surveys);
    });
  });

  describe('findOne', () => {
    it('should return a survey by id', async () => {
      const survey = { id: '1' };
      mockRepository.findOne.mockResolvedValue(survey);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(survey);
    });
  });

  describe('toggleActive', () => {
    it('should toggle is_active property', async () => {
      const survey = { id: '1', is_active: true };
      mockRepository.findOne.mockResolvedValue(survey);
      mockRepository.save.mockResolvedValue({ ...survey, is_active: false });

      await service.toggleActive('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        id: '1',
        is_active: false,
      });
    });

    it('should do nothing if survey not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await service.toggleActive('1');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return a survey', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      const survey = { id: '1', title: 'Updated' };
      mockRepository.findOne.mockResolvedValue(survey);

      const result = await service.update('1', { title: 'Updated' });

      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        title: 'Updated',
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(survey);
    });
  });

  describe('remove', () => {
    it('should delete a survey', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
