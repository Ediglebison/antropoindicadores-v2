import { Test, TestingModule } from '@nestjs/testing';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { AuthGuard } from '@nestjs/passport';

describe('SurveysController', () => {
  let controller: SurveysController;
  let surveysService: SurveysService;

  const mockSurveysService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SurveysController],
      providers: [
        {
          provide: SurveysService,
          useValue: mockSurveysService,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<SurveysController>(SurveysController);
    surveysService = module.get<SurveysService>(SurveysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a survey', async () => {
      const dto = { title: 'Test Survey', json_schema: {}, is_active: true };
      mockSurveysService.create.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.create(dto);

      expect(surveysService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1', ...dto });
    });
  });

  describe('findAll', () => {
    it('should return all surveys', async () => {
      const result = [{ id: '1', title: 'Survey 1' }];
      mockSurveysService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(surveysService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single survey', async () => {
      const id = '1';
      const result = { id, title: 'Survey 1' };
      mockSurveysService.findOne.mockResolvedValue(result);

      expect(await controller.findOne(id)).toBe(result);
      expect(surveysService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a survey', async () => {
      const id = '1';
      const dto = { title: 'Updated Survey' };
      mockSurveysService.update.mockResolvedValue({ id, ...dto });

      const result = await controller.update(id, dto);

      expect(surveysService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual({ id, ...dto });
    });
  });

  describe('remove', () => {
    it('should remove a survey', async () => {
      const id = '1';
      mockSurveysService.remove.mockResolvedValue({ affected: 1 });

      const result = await controller.remove(id);

      expect(surveysService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ affected: 1 });
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status of a survey', async () => {
      const id = '1';
      const result = { id, is_active: false };
      mockSurveysService.toggleActive.mockResolvedValue(result);

      expect(await controller.toggleActive(id)).toBe(result);
      expect(surveysService.toggleActive).toHaveBeenCalledWith(id);
    });
  });
});
