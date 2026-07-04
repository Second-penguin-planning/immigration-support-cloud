import { decryptField, encryptField, hashForLookup } from './encryption';

/**
 * 暗号化して保存する ForeignNational のカラム名。
 * それぞれ `${field}Hash` という検索用ハッシュ列とペアで存在する前提。
 */
export const ENCRYPTED_FOREIGN_NATIONAL_FIELDS = ['passportNumber', 'residenceCardNumber'] as const;

export type EncryptedForeignNationalField = (typeof ENCRYPTED_FOREIGN_NATIONAL_FIELDS)[number];

function hashColumnName(field: EncryptedForeignNationalField): string {
  return `${field}Hash`;
}

function encryptSingle<T extends Record<string, unknown>>(input: T): T {
  const output: Record<string, unknown> = { ...input };
  for (const field of ENCRYPTED_FOREIGN_NATIONAL_FIELDS) {
    if (!(field in output)) continue;
    const value = output[field];
    if (typeof value === 'string' && value.length > 0) {
      output[hashColumnName(field)] = hashForLookup(value);
      output[field] = encryptField(value);
    } else if (value === null) {
      output[field] = null;
      output[hashColumnName(field)] = null;
    }
  }
  return output as T;
}

/**
 * Prisma の create/update/upsert/createMany 等の書き込みペイロードを、
 * 暗号化対象フィールドについて「暗号文 + 検索用ハッシュ」に変換する。
 * `data`/`create`/`update` いずれも単一オブジェクトまたは配列(createMany)を受け付ける。
 */
export function encryptWritePayload<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) =>
      item && typeof item === 'object' ? encryptSingle(item as Record<string, unknown>) : item,
    ) as T;
  }
  if (data && typeof data === 'object') {
    return encryptSingle(data as Record<string, unknown>) as T;
  }
  return data;
}

function decryptSingle<T>(record: T): T {
  if (!record || typeof record !== 'object') return record;
  const output: Record<string, unknown> = { ...(record as Record<string, unknown>) };
  for (const field of ENCRYPTED_FOREIGN_NATIONAL_FIELDS) {
    const value = output[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        output[field] = decryptField(value);
      } catch {
        // 破損データ・鍵不一致は例外を伝播させず null 扱いにする(一覧取得全体を落とさない)。
        output[field] = null;
      }
    }
  }
  return output as T;
}

/**
 * Prisma の読み取り結果（単一レコード・配列いずれも）に対して復号を適用する。
 * count/aggregate 等、対象フィールドを持たない結果はそのまま返る。
 */
export function decryptReadResult<T>(result: T): T {
  if (Array.isArray(result)) {
    return result.map((item) => decryptSingle(item)) as T;
  }
  return decryptSingle(result);
}
