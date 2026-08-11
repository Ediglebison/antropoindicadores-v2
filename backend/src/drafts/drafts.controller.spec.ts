import { Test, TestingModule } from '@nestjs/testing';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { RolesGuard } from '../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';

const ROLES_KEY = 'roles';

describe('DraftsController', () => {
  let controller: DraftsController;
  let draftsService: DraftsService;

  const mockDraftsService = {
    create: jest.fn(),
    findAllForResearcher: jest.fn(),
    findOneForResearcher: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    finalize: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DraftsController],
      providers: [
        {
          provide: DraftsService,
          useValue: mockDraftsService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DraftsController>(DraftsController);
    draftsService = module.get<DraftsService>(DraftsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delega ao service com researcher_id do JWT', async () => {
      const dto = { survey_id: 's1', data_payload: {} };
      const req = { user: { userId: 'researcher123' } };
      mockDraftsService.create.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.create(dto, req);

      expect(draftsService.create).toHaveBeenCalledWith(dto, 'researcher123');
      expect(result).toEqual({ id: '1', ...dto });
    });
  });

  describe('findAll', () => {
    it('delega ao service com researcher_id do JWT', async () => {
      const req = { user: { userId: 'researcher123' } };
      const result = [{ id: '1' }];
      mockDraftsService.findAllForResearcher.mockResolvedValue(result);

      expect(await controller.findAll(req as any)).toBe(result);
      expect(draftsService.findAllForResearcher).toHaveBeenCalledWith(
        'researcher123',
      );
    });
  });

  describe('findOne', () => {
    it('delega ao service com id e researcher_id do JWT', async () => {
      const req = { user: { userId: 'researcher123' } };
      const result = { id: '1' };
      mockDraftsService.findOneForResearcher.mockResolvedValue(result);

      expect(await controller.findOne('1', req as any)).toBe(result);
      expect(draftsService.findOneForResearcher).toHaveBeenCalledWith(
        '1',
        'researcher123',
      );
    });
  });

  describe('update', () => {
    it('delega ao service com id, researcher_id e dto', async () => {
      const dto = { data_payload: { q1: 'a' } };
      const req = { user: { userId: 'researcher123' } };
      const result = { id: '1', ...dto };
      mockDraftsService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto as any, req as any)).toBe(result);
      expect(draftsService.update).toHaveBeenCalledWith(
        '1',
        'researcher123',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('delega ao service com id e researcher_id do JWT', async () => {
      const req = { user: { userId: 'researcher123' } };
      mockDraftsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', req as any);

      expect(draftsService.remove).toHaveBeenCalledWith('1', 'researcher123');
    });
  });

  describe('finalize', () => {
    it('delega ao service com id e researcher_id do JWT', async () => {
      const req = { user: { userId: 'researcher123' } };
      const result = { id: 'rsp-1' };
      mockDraftsService.finalize.mockResolvedValue(result);

      expect(await controller.finalize('1', req as any)).toBe(result);
      expect(draftsService.finalize).toHaveBeenCalledWith('1', 'researcher123');
    });
  });

  describe('RBAC — RolesGuard decorators', () => {
    const reflector = new Reflector();

    it('controller tem RolesGuard aplicado', () => {
      const guards = reflector.get('__guards__', DraftsController);
      expect(guards).toBeDefined();
      expect(guards.length).toBe(1);
      expect(guards[0]).toBe(RolesGuard);
    });

    it('create permite RESEARCHER e ADMIN', () => {
      const roles = reflector.get(ROLES_KEY, controller.create);
      expect(roles).toEqual([UserRole.RESEARCHER, UserRole.ADMIN]);
    });

    it('findAll permite RESEARCHER e ADMIN', () => {
      const roles = reflector.get(ROLES_KEY, controller.findAll);
      expect(roles).toEqual([UserRole.RESEARCHER, UserRole.ADMIN]);
    });

    it('findOne permite RESEARCHER e ADMIN', () => {
      const roles = reflector.get(ROLES_KEY, controller.findOne);
      expect(roles).toEqual([UserRole.RESEARCHER, UserRole.ADMIN]);
    });

    it('update permite RESEARCHER e ADMIN', () => {
      const roles = reflector.get(ROLES_KEY, controller.update);
      expect(roles).toEqual([UserRole.RESEARCHER, UserRole.ADMIN]);
    });

    it('remove permite RESEARCHER e ADMIN', () => {
      const roles = reflector.get(ROLES_KEY, controller.remove);
      expect(roles).toEqual([UserRole.RESEARCHER, UserRole.ADMIN]);
    });

    it('finalize permite RESEARCHER e ADMIN', () => {
      const roles = reflector.get(ROLES_KEY, controller.finalize);
      expect(roles).toEqual([UserRole.RESEARCHER, UserRole.ADMIN]);
    });
  });
});
