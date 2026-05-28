import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey } from '../surveys/entities/survey.entity';
import { Location } from '../locations/entities/location.entity';
import { Response } from '../responses/entities/response.entity';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';

describe('SyncService', () => {
  let service: SyncService;

  const mockSurveyRepo = { find: jest.fn() };
  const mockLocationRepo = { find: jest.fn() };
  const mockResponseRepo = {
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUserRepo = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getRepositoryToken(Survey), useValue: mockSurveyRepo },
        { provide: getRepositoryToken(Location), useValue: mockLocationRepo },
        { provide: getRepositoryToken(Response), useValue: mockResponseRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pullChanges', () => {
    it('should format and return created and updated entities', async () => {
      const lastPulledAt = 1000;

      const surveys = [
        {
          id: '1',
          created_at: new Date(2000),
          updated_at: new Date(2000),
          questions_schema: { q: 1 },
        }, // created
        {
          id: '2',
          created_at: new Date(500),
          updated_at: new Date(2000),
          questions_schema: 'string_schema',
        }, // updated
      ];
      mockSurveyRepo.find.mockResolvedValue(surveys);

      const locations = [
        { id: '1', created_at: new Date(2000), updated_at: new Date(2000) }, // created
      ];
      mockLocationRepo.find.mockResolvedValue(locations);

      const users = [
        { id: '1', created_at: new Date(2000) }, // created
      ];
      mockUserRepo.find.mockResolvedValue(users);

      const result = await service.pullChanges(lastPulledAt);

      expect(mockSurveyRepo.find).toHaveBeenCalled();
      expect(mockLocationRepo.find).toHaveBeenCalled();
      expect(mockUserRepo.find).toHaveBeenCalled();

      expect(result.changes.surveys.created.length).toBe(1);
      expect(result.changes.surveys.updated.length).toBe(1);
      expect(result.changes.surveys.created[0].questions_schema).toBe(
        '{"q":1}',
      );
      expect(result.changes.surveys.updated[0].questions_schema).toBe(
        'string_schema',
      );

      expect(result.changes.locations.created.length).toBe(1);
      expect(result.changes.users.created.length).toBe(1);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('pushChanges', () => {
    it('should save, update, and delete responses', async () => {
      const changes = {
        responses: {
          created: [{ id: '1', created_at: 1000, updated_at: 1000 }],
          updated: [{ id: '2', created_at: 1000, updated_at: 1000 }],
          deleted: ['3'],
        },
      };

      const result = await service.pushChanges(changes, 1000);

      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        {
          id: '1',
          created_at: new Date(1000),
          updated_at: new Date(1000),
        },
      ]);
      expect(mockResponseRepo.update).toHaveBeenCalledWith('2', {
        id: '2',
        created_at: new Date(1000),
        updated_at: new Date(1000),
      });
      expect(mockResponseRepo.delete).toHaveBeenCalledWith(['3']);
      expect(result).toEqual({ success: true });
    });

    it('should handle empty changes', async () => {
      const changes = { responses: null };
      const result = await service.pushChanges(changes, 1000);
      expect(result).toEqual({ success: true });
      expect(mockResponseRepo.save).not.toHaveBeenCalled();
    });
  });
});
