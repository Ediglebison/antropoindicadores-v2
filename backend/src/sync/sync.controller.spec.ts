import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

describe('SyncController', () => {
  let controller: SyncController;
  let syncService: SyncService;

  const mockSyncService = {
    pullChanges: jest.fn(),
    pushChanges: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: mockSyncService,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    syncService = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('pull', () => {
    it('should call pullChanges with parsed timestamp', async () => {
      const result = { changes: {}, timestamp: 1712619000000 };
      mockSyncService.pullChanges.mockResolvedValue(result);

      expect(await controller.pull('1712619000000')).toBe(result);
      expect(syncService.pullChanges).toHaveBeenCalledWith(1712619000000);
    });

    it('should call pullChanges with 0 if timestamp is null or empty', async () => {
      const result = { changes: {}, timestamp: 0 };
      mockSyncService.pullChanges.mockResolvedValue(result);

      expect(await controller.pull('null')).toBe(result);
      expect(syncService.pullChanges).toHaveBeenCalledWith(0);

      expect(await controller.pull('')).toBe(result);
      expect(syncService.pullChanges).toHaveBeenCalledWith(0);
    });
  });

  describe('push', () => {
    it('should call pushChanges and return success message', async () => {
      const body = { changes: {}, lastPulledAt: '1712619000000' };
      mockSyncService.pushChanges.mockResolvedValue(undefined);

      const result = await controller.push(body);

      expect(syncService.pushChanges).toHaveBeenCalledWith({}, 1712619000000);
      expect(result).toBe('Sync Push OK');
    });
  });
});
