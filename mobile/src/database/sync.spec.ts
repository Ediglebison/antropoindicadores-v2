import { syncData, isDraftSkippable } from './sync';
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

  it('pushChanges excludes drafts from the body sent to server', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue('fake-token');
    
    let capturedPushChanges: any;
    (synchronize as jest.Mock).mockImplementation(async ({ pushChanges }) => {
      capturedPushChanges = pushChanges;
    });

    await syncData();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const changes = {
      responses: {
        created: [
          { id: 'draft-1', is_draft: true },
          { id: 'complete-1', is_draft: false },
          { id: 'legacy-created-1' },
        ],
        updated: [
          { id: 'draft-2', is_draft: true },
          { id: 'complete-2', is_draft: false },
        ],
        deleted: ['server-response-1'],
      },
    };
    await capturedPushChanges({ changes, lastPulledAt: 12345 });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const sentChanges = JSON.parse(options.body).changes;

    expect(sentChanges.responses.created.map((record: any) => record.id)).toEqual([
      'complete-1',
      'legacy-created-1',
    ]);
    expect(sentChanges.responses.updated.map((record: any) => record.id)).toEqual(['complete-2']);
    expect(sentChanges.responses.deleted).toEqual(['server-response-1']);
  });
});

describe('isDraftSkippable', () => {
  it('keeps complete responses (is_draft=false)', () => {
    expect(isDraftSkippable({ is_draft: false })).toBe(false);
  });

  it('skips drafts (is_draft=true)', () => {
    expect(isDraftSkippable({ is_draft: true })).toBe(true);
  });

  it('treats a missing or undefined is_draft as a complete response', () => {
    expect(isDraftSkippable({})).toBe(false);
    expect(isDraftSkippable({ is_draft: undefined })).toBe(false);
  });
});
