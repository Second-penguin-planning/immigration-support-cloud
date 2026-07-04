import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const base64Key = process.env.ENCRYPTION_MASTER_KEY;
  if (!base64Key) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY が設定されていません。`openssl rand -base64 32` 等で生成し .env.local に設定してください。',
    );
  }
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY は base64 デコード後に32byteである必要があります。');
  }
  return key;
}

/**
 * マスターキーから用途別（暗号化用/検索ハッシュ用）にサブキーを導出する(HKDF)。
 * 1つの鍵を暗号化とHMACの両方に使い回さないための鍵分離。
 */
function deriveKey(purpose: 'encryption' | 'hashing'): Buffer {
  const master = getMasterKey();
  const derived = hkdfSync('sha256', master, Buffer.alloc(0), Buffer.from(purpose), 32);
  return Buffer.from(derived);
}

/** AES-256-GCMで暗号化し、`iv || authTag || ciphertext` をbase64化して返す。 */
export function encryptField(plainText: string): string {
  const key = deriveKey('encryption');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/** {@link encryptField} で暗号化された文字列を復号する。 */
export function decryptField(encoded: string): string {
  const key = deriveKey('encryption');
  const raw = Buffer.from(encoded, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * 完全一致検索用の一方向ハッシュ（HMAC-SHA256）。
 * 暗号化(AES-GCM)はIVが毎回異なり同一平文でも暗号文が変わるため検索に使えない。
 * そのためこのハッシュ値を別カラムに保持し、検索・重複チェックはこちらを使う。
 */
export function hashForLookup(value: string): string {
  const key = deriveKey('hashing');
  const normalized = value.trim().toUpperCase();
  return createHmac('sha256', key).update(normalized).digest('base64');
}
