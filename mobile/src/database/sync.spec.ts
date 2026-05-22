import { syncData } from './sync';
import { Storage } from '../utils/storage';
import { synchronize } from '@nozbe/watermelondb/sync';

jest.mock('@nozbe/watermelondb/sync', () => ({
  synchronize: jest.fn(),
}));

jest.mock('../utils/storage', () => ({
  Storage: {
    getItem: jest.fn(),
  },
}));

// Mock the global fetch
global.fetch = jest.fn();

// Mock database to be available
jest.mock('./index', () => ({
  database: {},
}));

describe('Sync Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls synchronize with database', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue('fake-token');
    
    // Fake successful sync
    (synchronize as jest.Mock).mockImplementation(async ({ pullChanges, pushChanges }) => {
      // Just simulate that the synchronize function was called
      return;
    });

    const onProgress = jest.fn();
    const result = await syncData(onProgress);

    expect(result).toBe(true);
    expect(Storage.getItem).toHaveBeenCalledWith('auth_token');
    expect(synchronize).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith('Sincronização concluída com sucesso!', 100);
  });

  it('pullChanges fetches from server', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue('fake-token');
    
    let capturedPullChanges: any;
    (synchronize as jest.Mock).mockImplementation(async ({ pullChanges }) => {
      capturedPullChanges = pullChanges;
    });

    await syncData();

    // Now test the pullChanges logic
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ changes: { surveys: { created: [], updated: [], deleted: [] } }, timestamp: 12345 }),
    });

    const pullResult = await capturedPullChanges({ lastPulledAt: 0 });
    
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/sync?lastPulledAt=0'), {
      headers: {
        'Authorization': 'Bearer fake-token'
      }
    });
    expect(pullResult.timestamp).toBe(12345);
  });

  it('pushChanges sends data to server', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue('fake-token');
    
    let capturedPushChanges: any;
    (synchronize as jest.Mock).mockImplementation(async ({ pushChanges }) => {
      capturedPushChanges = pushChanges;
    });

    await syncData();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const changes = { surveys: { created: [], updated: [], deleted: [] } };
    await capturedPushChanges({ changes, lastPulledAt: 12345 });
    
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/sync'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      },
      body: JSON.stringify({ changes, lastPulledAt: 12345 }),
    });
  });

  it('throws an error when sync fails', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue('fake-token');
    
    (synchronize as jest.Mock).mockRejectedValue(new Error('Sync error'));

    await expect(syncData()).rejects.toThrow('Sync error');
  });
});
