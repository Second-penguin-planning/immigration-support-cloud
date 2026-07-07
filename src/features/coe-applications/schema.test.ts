import { describe, expect, it } from 'vitest';
import { coeApplicationSchema, convertToResidenceStatusSchema } from './schema';

describe('coeApplicationSchema', () => {
  it('在留資格の種類だけあれば有効(他は任意)', () => {
    const result = coeApplicationSchema.safeParse({ statusType: '技術・人文知識・国際業務' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plannedSubmissionDate).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });

  it('在留資格の種類が空だとエラーになる', () => {
    const result = coeApplicationSchema.safeParse({ statusType: '' });
    expect(result.success).toBe(false);
  });

  it('申請予定日が入力されれば日付に変換される', () => {
    const result = coeApplicationSchema.safeParse({
      statusType: '特定技能1号',
      plannedSubmissionDate: '2026-08-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plannedSubmissionDate).toBeInstanceOf(Date);
    }
  });
});

describe('convertToResidenceStatusSchema', () => {
  it('在留カード番号と在留期限が揃っていれば有効', () => {
    const result = convertToResidenceStatusSchema.safeParse({
      residenceCardNumber: 'AB12345678CD',
      expiresAt: '2027-08-15',
    });
    expect(result.success).toBe(true);
  });

  it('在留カード番号が空だとエラーになる', () => {
    const result = convertToResidenceStatusSchema.safeParse({
      residenceCardNumber: '',
      expiresAt: '2027-08-15',
    });
    expect(result.success).toBe(false);
  });

  it('在留期限が無いとエラーになる', () => {
    const result = convertToResidenceStatusSchema.safeParse({
      residenceCardNumber: 'AB12345678CD',
    });
    expect(result.success).toBe(false);
  });
});
