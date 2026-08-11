import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Survey } from '../surveys/entities/survey.entity';
import { Location } from '../locations/entities/location.entity';
import { Response } from '../responses/entities/response.entity';
import { User } from '../users/user.entity';

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

    it('B2: o pull entrega id/name/role mas nunca password_hash ou access_code', async () => {
      const lastPulledAt = 1000;

      mockSurveyRepo.find.mockResolvedValue([]);
      mockLocationRepo.find.mockResolvedValue([]);
      mockUserRepo.find.mockResolvedValue([
        {
          id: '1',
          name: 'Ana',
          role: 'RESEARCHER',
          access_code: 'SEGREDO123',
          password_hash: '$2a$10$hash-vazado',
          created_at: new Date(2000),
        },
      ]);

      const result = await service.pullChanges(lastPulledAt);

      expect(result.changes.users.created[0]).toMatchObject({
        id: '1',
        name: 'Ana',
        role: 'RESEARCHER',
      });
      expect(result.changes.users.created[0]).not.toHaveProperty(
        'password_hash',
      );
      expect(result.changes.users.created[0]).not.toHaveProperty('access_code');
    });
  });

  describe('pushChanges', () => {
    it('should upsert created and updated responses, and delete removed', async () => {
      const changes = {
        responses: {
          created: [{ id: '1', created_at: 1000, updated_at: 1000 }],
          updated: [{ id: '2', created_at: 1000, updated_at: 1000 }],
          deleted: ['3'],
        },
      };

      const result = await service.pushChanges(changes);

      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        {
          id: '1',
          created_at: new Date(1000),
          updated_at: new Date(1000),
        },
      ]);
      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        {
          id: '2',
          created_at: new Date(1000),
          updated_at: new Date(1000),
        },
      ]);
      expect(mockResponseRepo.update).not.toHaveBeenCalled();
      expect(mockResponseRepo.delete).toHaveBeenCalledWith(['3']);
      expect(result).toEqual({ success: true });
    });

    it('should handle empty changes', async () => {
      const changes = { responses: null };
      const result = await service.pushChanges(changes);
      expect(result).toEqual({ success: true });
      expect(mockResponseRepo.save).not.toHaveBeenCalled();
    });

    it('Bad: descarta o marcador is_draft residual vindo do mobile', async () => {
      const changes = {
        responses: {
          created: [
            {
              id: '1',
              is_draft: true,
              created_at: 1000,
              updated_at: 1000,
            },
          ],
          updated: [],
          deleted: [],
        },
      };

      const result = await service.pushChanges(changes);

      expect(result).toEqual({ success: true });
      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        {
          id: '1',
          created_at: new Date(1000),
          updated_at: new Date(1000),
        },
      ]);
      expect(mockResponseRepo.save.mock.calls[0][0][0]).not.toHaveProperty(
        'is_draft',
      );
    });

    it('W1: upserta a resposta finalizada que só chegou no bucket updated', async () => {
      const changes = {
        responses: {
          created: [],
          updated: [
            {
              id: 'draft-finalizado-1',
              survey_id: 'sur-1',
              location_id: 'loc-1',
              is_draft: false,
              data_payload: '{"q1":"ok"}',
              created_at: 1000,
              updated_at: 2000,
            },
          ],
          deleted: [],
        },
      };

      const result = await service.pushChanges(changes);

      expect(result).toEqual({ success: true });
      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'draft-finalizado-1',
          survey_id: 'sur-1',
          location_id: 'loc-1',
          data_payload: '{"q1":"ok"}',
          created_at: new Date(1000),
          updated_at: new Date(2000),
        }),
      ]);
      expect(mockResponseRepo.save.mock.calls[0][0][0]).not.toHaveProperty(
        'is_draft',
      );
      expect(mockResponseRepo.update).not.toHaveBeenCalled();
    });

    it('B1: descarta researcher_id e campos extras do cliente em ambos os buckets', async () => {
      const changes = {
        responses: {
          created: [
            {
              id: 'c1',
              survey_id: 'sur-1',
              location_id: 'loc-1',
              researcher_id: 'hacker-id',
              injected_field: 'não deveria existir',
              data_payload: '{"q1":"ok"}',
              created_at: 1000,
              updated_at: 1000,
            },
          ],
          updated: [
            {
              id: 'u1',
              survey_id: 'sur-2',
              location_id: 'loc-2',
              researcher_id: 'hacker-id',
              injected_field: 'não deveria existir',
              data_payload: '{"q1":"ok"}',
              created_at: 2000,
              updated_at: 2000,
            },
          ],
          deleted: [],
        },
      };

      const result = await service.pushChanges(changes);

      expect(result).toEqual({ success: true });
      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        {
          id: 'c1',
          survey_id: 'sur-1',
          location_id: 'loc-1',
          data_payload: '{"q1":"ok"}',
          created_at: new Date(1000),
          updated_at: new Date(1000),
        },
      ]);
      expect(mockResponseRepo.save).toHaveBeenCalledWith([
        {
          id: 'u1',
          survey_id: 'sur-2',
          location_id: 'loc-2',
          data_payload: '{"q1":"ok"}',
          created_at: new Date(2000),
          updated_at: new Date(2000),
        },
      ]);
      expect(mockResponseRepo.save.mock.calls[0][0][0]).not.toHaveProperty(
        'researcher_id',
      );
      expect(mockResponseRepo.save.mock.calls[0][0][0]).not.toHaveProperty(
        'injected_field',
      );
      expect(mockResponseRepo.save.mock.calls[1][0][0]).not.toHaveProperty(
        'researcher_id',
      );
      expect(mockResponseRepo.save.mock.calls[1][0][0]).not.toHaveProperty(
        'injected_field',
      );
    });
  });
});
