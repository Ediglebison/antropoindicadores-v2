import { Test, TestingModule } from '@nestjs/testing';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { RolesGuard } from '../auth/roles.guard';

describe('ResponsesController', () => {
  let controller: ResponsesController;
  let responsesService: ResponsesService;

  const mockResponsesService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResponsesController],
      providers: [
        {
          provide: ResponsesService,
          useValue: mockResponsesService,
        },
      ],
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<ResponsesController>(ResponsesController);
    responsesService = module.get<ResponsesService>(ResponsesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a response', async () => {
      const dto = { survey_id: '1', answers: {}, location_id: '1' };
      const req = { user: { userId: 'researcher123' } };
      mockResponsesService.create.mockResolvedValue({ id: '1', ...dto, researcher_id: 'researcher123' });

      const result = await controller.create(dto as any, req);

      expect(responsesService.create).toHaveBeenCalledWith(dto, 'researcher123');
      expect(result).toEqual({ id: '1', ...dto, researcher_id: 'researcher123' });
    });
  });

  describe('findAll', () => {
    it('should return all responses', async () => {
      const result = [{ id: '1', survey_id: '1' }];
      mockResponsesService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(responsesService.findAll).toHaveBeenCalled();
    });
  });
});
