import * as localStorage from './local-storage';
import * as s3Storage from './s3-storage';

/**
 * ファイルストレージの切替facade。`FILE_STORAGE_DRIVER`環境変数でドライバを選択する。
 * - local: ローカルディスク（開発用。サーバーレス環境ではインスタンス間で永続化されないため本番非推奨）
 * - s3: S3互換オブジェクトストレージ（本番運用時はこちら）
 */

export { buildStorageKey, sanitizeFileNameComponent } from './local-storage';

function driver() {
  return process.env.FILE_STORAGE_DRIVER === 's3' ? s3Storage : localStorage;
}

export function saveFile(key: string, buffer: Buffer): Promise<void> {
  return driver().saveFile(key, buffer);
}

export function readStoredFile(key: string): Promise<Buffer> {
  return driver().readStoredFile(key);
}

export function deleteStoredFile(key: string): Promise<void> {
  return driver().deleteStoredFile(key);
}
