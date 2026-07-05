import { describe, expect, it } from 'vitest';
import { getSupportTypeLabel, SUPPORT_TYPES } from './constants';

describe('SUPPORT_TYPES', () => {
  it('keyが重複しない(支援実施状況の自動作成でsupportTypeの一意性を前提にしているため)', () => {
    const keys = SUPPORT_TYPES.map((type) => type.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('getSupportTypeLabel', () => {
  it('マスタに存在するkeyはラベルを返す', () => {
    expect(getSupportTypeLabel('life_orientation')).toBe('生活オリエンテーション');
  });

  it('マスタに存在しないkeyはそのまま返す', () => {
    expect(getSupportTypeLabel('unknown_key')).toBe('unknown_key');
  });
});
