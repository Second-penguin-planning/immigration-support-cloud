import { describe, expect, it } from 'vitest';
import { clientSchema, foreignNationalSchema, residenceStatusSchema } from './schema';

describe('clientSchema', () => {
  it('法人名のみでも有効(その他は任意)', () => {
    const result = clientSchema.safeParse({ companyName: '株式会社サンプル' });
    expect(result.success).toBe(true);
  });

  it('空文字のcontactEmailはundefinedとして扱われる(バリデーションエラーにならない)', () => {
    const result = clientSchema.safeParse({ companyName: 'A', contactEmail: '' });
    expect(result.success).toBe(true);
  });

  it('不正な形式のcontactEmailはエラーになる', () => {
    const result = clientSchema.safeParse({ companyName: 'A', contactEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('法人名が空文字だとエラーになる', () => {
    const result = clientSchema.safeParse({ companyName: '' });
    expect(result.success).toBe(false);
  });
});

describe('foreignNationalSchema', () => {
  it('空文字のbirthDateはundefinedとして扱われる', () => {
    const result = foreignNationalSchema.safeParse({
      fullName: '山田太郎',
      nationality: '日本',
      birthDate: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDate).toBeUndefined();
    }
  });

  it('日付文字列はDate型に変換される', () => {
    const result = foreignNationalSchema.safeParse({
      fullName: '山田太郎',
      nationality: '日本',
      birthDate: '1998-04-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDate).toBeInstanceOf(Date);
    }
  });
});

describe('residenceStatusSchema', () => {
  it('在留期限は必須', () => {
    const result = residenceStatusSchema.safeParse({ statusType: '特定技能1号', expiresAt: '' });
    expect(result.success).toBe(false);
  });

  it('必須項目が揃っていれば有効', () => {
    const result = residenceStatusSchema.safeParse({
      statusType: '特定技能1号',
      expiresAt: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });
});
