import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DraftsService } from './drafts.service';
import { Draft } from './entities/draft.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
import { ResponsesService } from '../responses/responses.service';

describe('DraftsService', () => {
  let service: DraftsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockResponsesService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftsService,
        {
          provide: getRepositoryToken(Draft),
          useValue: mockRepository,
        },
        {
          provide: ResponsesService,
          useValue: mockResponsesService,
        },
      ],
    }).compile();

    service = module.get<DraftsService>(DraftsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (AC1)', () => {
    it('Good: salva com researcher_id e data_payload', async () => {
      const dto = {
        survey_id: 's1',
        location_id: 'l1',
        data_payload: { q1: 'a' },
      };
      const expectedDraft = {
        id: '123',
        data_payload: dto.data_payload,
        survey_id: dto.survey_id,
        location_id: dto.location_id,
        researcher_id: 'r1',
      };
      mockRepository.create.mockReturnValue(expectedDraft);
      mockRepository.save.mockResolvedValue(expectedDraft);

      jest.spyOn(Date, 'now').mockReturnValue(123);

      const result = await service.create(dto, 'r1');

      expect(mockRepository.create).toHaveBeenCalledWith(expectedDraft);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedDraft);

      jest.restoreAllMocks();
    });

    it('Bad: DTO sem data_payload é rejeitado na validação (pipe)', async () => {
      const dto = plainToInstance(CreateDraftDto, { survey_id: 's1' });
      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'data_payload')).toBe(
        true,
      );
    });

    it('Ugly: researcher_id vindo no body é rejeitado (whitelist), usa o do JWT', async () => {
      const dto = plainToInstance(CreateDraftDto, {
        survey_id: 's1',
        data_payload: { q1: 'a' },
        researcher_id: 'invasor',
      });
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(errors.some((error) => error.property === 'researcher_id')).toBe(
        true,
      );
    });
  });

  describe('findAllForResearcher (AC2)', () => {
    it('Good: filtra por researcher_id com relations e order', async () => {
      const drafts = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(drafts);

      const result = await service.findAllForResearcher('r1');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { researcher_id: 'r1' },
        relations: ['survey', 'location'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(drafts);
    });

    it('Bad: só há rascunho de outro pesquisador → lista vazia', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAllForResearcher('r1');

      expect(result).toEqual([]);
    });

    it('Ugly: o único critério de isolamento é o researcher_id', async () => {
      const drafts = [{ id: '1' }];
      mockRepository.find.mockResolvedValue(drafts);

      await service.findAllForResearcher('r1');

      const call = mockRepository.find.mock.calls[0][0];
      expect(call.where).toEqual({ researcher_id: 'r1' });
    });
  });

  describe('findOneForResearcher (AC3)', () => {
    it('Good: busca filtrando por id e researcher_id', async () => {
      const draft = { id: '1', researcher_id: 'r1' };
      mockRepository.findOne.mockResolvedValue(draft);

      const result = await service.findOneForResearcher('1', 'r1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', researcher_id: 'r1' },
      });
      expect(result).toEqual(draft);
    });

    it('Bad: id de outro pesquisador → NotFoundException (isolamento)', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForResearcher('1', 'outro')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Ugly: id inexistente → 404 uniforme', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneForResearcher('nao-existe', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update (AC4)', () => {
    it('Good: atualiza apenas com o critério do dono e retorna o rascunho', async () => {
      const dto = { data_payload: { q1: 'b' } };
      const updatedDraft = { id: '1', researcher_id: 'r1', ...dto };
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedDraft);

      const result = await service.update('1', 'r1', dto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: '1', researcher_id: 'r1' },
        dto,
      );
      expect(result).toEqual(updatedDraft);
    });

    it('Bad: id de outro pesquisador → NotFoundException, nada é tocado', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', 'outro', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update.mock.calls[0][0]).toEqual({
        id: '1',
        researcher_id: 'outro',
      });
    });

    it('Ugly: id inexistente → 404 uniforme', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nao-existe', 'r1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (AC5)', () => {
    it('Good: apaga filtrando por id e researcher_id', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1', 'r1');

      expect(mockRepository.delete).toHaveBeenCalledWith({
        id: '1',
        researcher_id: 'r1',
      });
    });

    it('Bad/Ugly: id de outro ou inexistente não afeta nada (criterio isola)', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('1', 'outro')).resolves.toBeUndefined();
      await expect(service.remove('nao-existe', 'r1')).resolves.toBeUndefined();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        id: 'nao-existe',
        researcher_id: 'r1',
      });
    });
  });

  describe('finalize (AC6)', () => {
    it('Good: cria a Response completa e depois remove o rascunho', async () => {
      const draft = {
        id: '1',
        survey_id: 's1',
        location_id: 'l1',
        researcher_id: 'r1',
        data_payload: { q1: 'a' },
      };
      const response = { id: 'rsp-1', ...draft };
      const removeSpy = jest.spyOn(service, 'remove').mockResolvedValue();
      mockRepository.findOne.mockResolvedValue(draft);
      mockResponsesService.create.mockResolvedValue(response);

      const result = await service.finalize('1', 'r1');

      expect(mockResponsesService.create).toHaveBeenCalledWith(
        {
          survey_id: 's1',
          location_id: 'l1',
          answers_json: { q1: 'a' },
        },
        'r1',
      );
      expect(removeSpy).toHaveBeenCalledWith('1', 'r1');
      expect(result).toBe(response);
    });

    it('Bad: id inexistente → 404 e nada é criado', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.finalize('nao-existe', 'r1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockResponsesService.create).not.toHaveBeenCalled();
    });

    it('Ugly: data_payload vazio passa como answers_json sem perder o rascunho se falhar', async () => {
      const draft = {
        id: '1',
        survey_id: 's1',
        researcher_id: 'r1',
        data_payload: {},
      };
      mockRepository.findOne.mockResolvedValue(draft);
      mockResponsesService.create.mockRejectedValue(
        new Error('falha no banco'),
      );

      await expect(service.finalize('1', 'r1')).rejects.toThrow(
        'falha no banco',
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
