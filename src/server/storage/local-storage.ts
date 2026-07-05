import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

function baseDir(): string {
  // 環境変数由来の動的パスをNext.jsのファイルトレーサーがプロジェクト全体の依存として
  // 誤検知しないよう明示的に除外する(ビルド警告対策)。
  return path.resolve(
    /* turbopackIgnore: true */ process.env.FILE_STORAGE_LOCAL_DIR ?? './uploads',
  );
}

/** cuid等のIDをpathセグメントとして使う前提の検証(パストラバーサル対策)。 */
function assertSafePathSegment(segment: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(segment)) {
    throw new Error(`不正なストレージパスセグメントです: ${segment}`);
  }
  return segment;
}

const UNSAFE_FILENAME_CHARS = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];

/** 表示用ファイル名からパス区切り文字・記号を除去する(スペースやハイフンは残す)。 */
export function sanitizeFileNameComponent(name: string): string {
  let cleaned = name;
  for (const char of UNSAFE_FILENAME_CHARS) {
    cleaned = cleaned.split(char).join('_');
  }
  cleaned = cleaned.trim();
  return cleaned || 'file';
}

/** tenantId/foreignNationalId/documentId等のIDから安全なストレージキーを組み立てる。 */
export function buildStorageKey(...idSegments: string[]): string {
  return idSegments.map(assertSafePathSegment).join('/');
}

export async function saveFile(key: string, buffer: Buffer): Promise<void> {
  const absolutePath = path.join(baseDir(), key);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(path.join(baseDir(), key));
}

export async function deleteStoredFile(key: string): Promise<void> {
  await unlink(path.join(baseDir(), key)).catch(() => undefined);
}
