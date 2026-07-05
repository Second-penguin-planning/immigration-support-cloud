import { describe, expect, it } from 'vitest';
import {
  interviewSchema,
  newPeriodicReportSchema,
  periodicReportContentSchema,
  supportRecordUpdateSchema,
} from './schema';

describe('newPeriodicReportSchema', () => {
  it('「YYYY-Q数字」形式であれば有効', () => {
    const result = newPeriodicReportSchema.safeParse({ reportPeriod: '2026-Q3' });
    expect(result.success).toBe(true);
  });

  it('形式が異なるとエラーになる', () => {
    const result = newPeriodicReportSchema.safeParse({ reportPeriod: '2026年7月' });
    expect(result.success).toBe(false);
  });
});

describe('periodicReportContentSchema', () => {
  it('全て空でも有効(全項目任意)', () => {
    const result = periodicReportContentSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.jobDescriptionChanged).toBe(false);
      expect(result.data.salaryAmount).toBeUndefined();
    }
  });

  it('チェックボックスの"on"はtrueに変換される', () => {
    const result = periodicReportContentSchema.safeParse({
      jobDescriptionChanged: 'on',
      salaryChanged: 'on',
      workingConditionsChanged: 'on',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.jobDescriptionChanged).toBe(true);
      expect(result.data.salaryChanged).toBe(true);
      expect(result.data.workingConditionsChanged).toBe(true);
    }
  });

  it('報酬の月額は負数だとエラーになる', () => {
    const result = periodicReportContentSchema.safeParse({ salaryAmount: '-1000' });
    expect(result.success).toBe(false);
  });

  it('報酬の月額は文字列から数値に変換される', () => {
    const result = periodicReportContentSchema.safeParse({ salaryAmount: '200000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.salaryAmount).toBe(200000);
    }
  });
});

describe('interviewSchema', () => {
  it('実施日と面談者が揃っていれば有効', () => {
    const result = interviewSchema.safeParse({
      conductedAt: '2026-07-01',
      conductedBy: '担当A',
    });
    expect(result.success).toBe(true);
  });

  it('面談者が空だとエラーになる', () => {
    const result = interviewSchema.safeParse({ conductedAt: '2026-07-01', conductedBy: '' });
    expect(result.success).toBe(false);
  });
});

describe('supportRecordUpdateSchema', () => {
  it('未チェックのimplementedはfalseになる', () => {
    const result = supportRecordUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.implemented).toBe(false);
    }
  });

  it('チェック済みでimplementedAtが空でも有効', () => {
    const result = supportRecordUpdateSchema.safeParse({ implemented: 'on', implementedAt: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.implemented).toBe(true);
      expect(result.data.implementedAt).toBeUndefined();
    }
  });
});
