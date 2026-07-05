import { describe, expect, it } from 'vitest';
import type { CsvTemplateDefinition } from '@/features/csv-templates/constants';
import { toCsv } from './csv';
import { buildCsvColumns, validateTemplateRow, type CsvTemplateRowSource } from './csv-template';

const definition: CsvTemplateDefinition = {
  encoding: 'utf-8',
  columns: [
    { key: 'companyName', label: '法人名', required: true },
    { key: 'fullName', label: '氏名', required: true },
    { key: 'residenceCardNumber', label: '在留カード番号', required: true },
    { key: 'fullNameKana', label: 'フリガナ', required: false },
    { key: 'expiresAt', label: '在留期限', required: true },
  ],
};

const validSource: CsvTemplateRowSource = {
  companyName: '株式会社サンプル',
  fullName: '山田太郎',
  fullNameKana: null,
  nationality: '日本',
  birthDate: null,
  passportNumber: null,
  residenceCardNumber: 'AB12345678CD',
  statusType: '特定技能1号',
  permitNumber: null,
  expiresAt: new Date('2027-01-01'),
};

describe('validateTemplateRow', () => {
  it('必須項目が全て埋まっていれば不足なし', () => {
    const result = validateTemplateRow(definition, validSource);
    expect(result.missingFieldLabels).toEqual([]);
  });

  it('必須項目が空だと不足として検出される', () => {
    const result = validateTemplateRow(definition, { ...validSource, residenceCardNumber: null });
    expect(result.missingFieldLabels).toEqual(['在留カード番号']);
  });

  it('任意項目が空でも不足として扱わない', () => {
    const result = validateTemplateRow(definition, { ...validSource, fullNameKana: null });
    expect(result.missingFieldLabels).toEqual([]);
  });
});

describe('buildCsvColumns + toCsv', () => {
  it('テンプレートの列定義通りにCSV行を生成する', () => {
    const columns = buildCsvColumns(definition);
    const csv = toCsv([validSource], columns);
    expect(csv).toBe(
      '法人名,氏名,在留カード番号,フリガナ,在留期限\r\n株式会社サンプル,山田太郎,AB12345678CD,,2027-01-01',
    );
  });
});
