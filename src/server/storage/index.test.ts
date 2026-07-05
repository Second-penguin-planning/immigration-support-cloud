import { afterEach, describe, expect, it, vi } from 'vitest';

const localSaveFile = vi.fn().mockResolvedValue(undefined);
const s3SaveFile = vi.fn().mockResolvedValue(undefined);

vi.mock('./local-storage', () => ({
  saveFile: localSaveFile,
  readStoredFile: vi.fn(),
  deleteStoredFile: vi.fn(),
  buildStorageKey: vi.fn(),
  sanitizeFileNameComponent: vi.fn(),
}));

vi.mock('./s3-storage', () => ({
  saveFile: s3SaveFile,
  readStoredFile: vi.fn(),
  deleteStoredFile: vi.fn(),
}));

const { saveFile } = await import('./index');

describe('storage facade', () => {
  afterEach(() => {
    localSaveFile.mockClear();
    s3SaveFile.mockClear();
    delete process.env.FILE_STORAGE_DRIVER;
  });

  it('FILE_STORAGE_DRIVER未設定時はローカルディスクドライバを使う', async () => {
    await saveFile('key', Buffer.from('a'));
    expect(localSaveFile).toHaveBeenCalledTimes(1);
    expect(s3SaveFile).not.toHaveBeenCalled();
  });

  it('FILE_STORAGE_DRIVER=s3のときはS3ドライバを使う', async () => {
    process.env.FILE_STORAGE_DRIVER = 's3';
    await saveFile('key', Buffer.from('a'));
    expect(s3SaveFile).toHaveBeenCalledTimes(1);
    expect(localSaveFile).not.toHaveBeenCalled();
  });
});
