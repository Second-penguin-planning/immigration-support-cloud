import { describe, expect, it } from 'vitest';
import { detectAnomalies } from './anomaly-detection';

const now = new Date('2026-07-05');

const validInput = {
  birthDate: new Date('1998-04-01'),
  passportNumber: 'N1234567',
  residenceCardNumber: 'AB12345678CD',
  residenceStatuses: [
    {
      statusType: '特定技能1号',
      grantedAt: new Date('2024-08-01'),
      expiresAt: new Date('2027-08-15'),
    },
  ],
};

describe('detectAnomalies', () => {
  it('問題がなければ空配列を返す', () => {
    expect(detectAnomalies(validInput, now)).toEqual([]);
  });

  it('生年月日が未来だとエラー', () => {
    const anomalies = detectAnomalies({ ...validInput, birthDate: new Date('2030-01-01') }, now);
    expect(anomalies).toContainEqual({
      level: 'error',
      message: '生年月日が未来の日付になっています。',
    });
  });

  it('許可年月日が在留期限より後だとエラー', () => {
    const anomalies = detectAnomalies(
      {
        ...validInput,
        residenceStatuses: [
          {
            statusType: '特定技能1号',
            grantedAt: new Date('2028-01-01'),
            expiresAt: new Date('2027-08-15'),
          },
        ],
      },
      now,
    );
    expect(anomalies.some((a) => a.level === 'error' && a.message.includes('在留期限より後'))).toBe(
      true,
    );
  });

  it('許可年月日が生年月日より前だとエラー', () => {
    const anomalies = detectAnomalies(
      {
        ...validInput,
        residenceStatuses: [
          {
            statusType: '特定技能1号',
            grantedAt: new Date('1990-01-01'),
            expiresAt: new Date('2027-08-15'),
          },
        ],
      },
      now,
    );
    expect(anomalies.some((a) => a.level === 'error' && a.message.includes('生年月日より前'))).toBe(
      true,
    );
  });

  it('在留期限が既に過ぎていると警告', () => {
    const anomalies = detectAnomalies(
      {
        ...validInput,
        residenceStatuses: [
          {
            statusType: '特定技能1号',
            grantedAt: new Date('2020-01-01'),
            expiresAt: new Date('2025-01-01'),
          },
        ],
      },
      now,
    );
    expect(
      anomalies.some((a) => a.level === 'warning' && a.message.includes('既に過ぎています')),
    ).toBe(true);
  });

  it('旅券番号が短すぎると警告', () => {
    const anomalies = detectAnomalies({ ...validInput, passportNumber: 'AB1' }, now);
    expect(anomalies).toContainEqual({
      level: 'warning',
      message: '旅券番号の桁数が短すぎる可能性があります。',
    });
  });

  it('在留カード番号が短すぎると警告', () => {
    const anomalies = detectAnomalies({ ...validInput, residenceCardNumber: 'AB123' }, now);
    expect(anomalies).toContainEqual({
      level: 'warning',
      message: '在留カード番号の桁数が短すぎる可能性があります。',
    });
  });

  it('nullの項目はチェックをスキップする', () => {
    const anomalies = detectAnomalies(
      { ...validInput, passportNumber: null, residenceCardNumber: null, birthDate: null },
      now,
    );
    expect(anomalies).toEqual([]);
  });
});
