import { describe, expect, it } from 'vitest';
import { extractedFieldsSchema } from './schema';

describe('extractedFieldsSchema', () => {
  it('全項目nullでも有効(書類から何も読み取れなかった場合)', () => {
    const result = extractedFieldsSchema.safeParse({
      fullName: null,
      fullNameKana: null,
      nationality: null,
      birthDate: null,
      passportNumber: null,
      residenceCardNumber: null,
      statusType: null,
      expiresAt: null,
    });
    expect(result.success).toBe(true);
  });

  it('一部項目のみでも有効', () => {
    const result = extractedFieldsSchema.safeParse({
      fullName: '山田太郎',
      residenceCardNumber: 'AB12345678CD',
    });
    expect(result.success).toBe(true);
  });

  it('日付がYYYY-MM-DD形式でない場合はエラーになる', () => {
    const result = extractedFieldsSchema.safeParse({ birthDate: '1998年4月1日' });
    expect(result.success).toBe(false);
  });

  it('空文字は無効(nullを使うべき)', () => {
    const result = extractedFieldsSchema.safeParse({ fullName: '' });
    expect(result.success).toBe(false);
  });
});
