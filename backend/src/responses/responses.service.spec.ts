import { Test, TestingModule } from '@nestjs/testing';
import { ResponsesService } from './responses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Response } from './entities/response.entity';

describe('ResponsesService', () => {
  let service: ResponsesService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsesService,
        {
          provide: getRepositoryToken(Response),
          useValue: mockResponseRepository,
        },
      ],
    }).compile();

    service = module.get<ResponsesService>(ResponsesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new response', async () => {
      const dto = {
        answers_json: '{"q": "a"}',
        survey_id: 's1',
        location_id: 'l1',
      };
      const expectedResponse = {
        id: '123',
        data_payload: dto.answers_json,
        survey_id: dto.survey_id,
        location_id: dto.location_id,
        researcher_id: 'r1',
      };
      mockRepository.create.mockReturnValue(expectedResponse);
      mockRepository.save.mockResolvedValue(expectedResponse);

      jest.spyOn(Date, 'now').mockReturnValue(123);

      const result = await service.create(dto, 'r1');

      expect(mockRepository.create).toHaveBeenCalledWith(expectedResponse);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);

      jest.restoreAllMocks();
    });
  });

  describe('findAll', () => {
    it('should return all responses with relations', async () => {
      const responses = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(responses);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['survey', 'location', 'researcher'],
        order: { collected_at: 'DESC' },
      });
      expect(result).toEqual(responses);
    });
  });
});
