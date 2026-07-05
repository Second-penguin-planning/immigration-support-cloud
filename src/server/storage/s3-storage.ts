import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

/**
 * S3互換オブジェクトストレージのドライバ。Vercel等のサーバーレス環境では
 * ローカルディスクが永続化されない(インスタンス間・デプロイ間で共有されない)ため、
 * 本番運用ではこちらを使う想定（`FILE_STORAGE_DRIVER=s3`）。
 */

let cachedClient: S3Client | undefined;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.S3_ENDPOINT || undefined;
  const region = process.env.S3_REGION || 'ap-northeast-1';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3ストレージを使うには S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY を設定してください。',
    );
  }

  cachedClient = new S3Client({
    region,
    endpoint,
    // S3互換ストレージ(MinIO等)ではパス形式のURLが必要なことが多いため明示的に指定する
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('S3ストレージを使うには S3_BUCKET を設定してください。');
  }
  return bucket;
}

export async function saveFile(key: string, buffer: Buffer): Promise<void> {
  await getClient().send(new PutObjectCommand({ Bucket: getBucket(), Key: key, Body: buffer }));
}

export async function readStoredFile(key: string): Promise<Buffer> {
  const result = await getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));
  const body = result.Body;
  if (!body) {
    throw new Error(`ストレージからファイルを取得できませんでした: ${key}`);
  }
  const bytes = await body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteStoredFile(key: string): Promise<void> {
  await getClient()
    .send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }))
    .catch(() => undefined);
}
