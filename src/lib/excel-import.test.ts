import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { parseClientImportWorkbook } from './excel-import';

const HEADERS = [
  '法人名',
  '氏名',
  'フリガナ',
  '国籍',
  '生年月日',
  '旅券番号',
  '在留カード番号',
  '在留資格',
  '在留期限',
];

async function buildWorkbookBuffer(rows: (string | Date | null)[][]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.addRow(HEADERS);
  for (const row of rows) {
    sheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

describe('parseClientImportWorkbook', () => {
  it('正常な行を解析しdataを持つ', async () => {
    const buffer = await buildWorkbookBuffer([
      [
        '株式会社サンプル商事',
        'グエン ヴァン アン',
        'グエン ヴァン アン',
        'ベトナム',
        new Date('1998-04-01'),
        'N1234567',
        'AB12345678CD',
        '特定技能1号',
        new Date('2026-12-31'),
      ],
    ]);

    const rows = await parseClientImportWorkbook(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].data?.companyName).toBe('株式会社サンプル商事');
    expect(rows[0].data?.fullName).toBe('グエン ヴァン アン');
    expect(rows[0].data?.expiresAt).toBeInstanceOf(Date);
  });

  it('必須項目が欠けている行はエラーになる', async () => {
    const buffer = await buildWorkbookBuffer([
      ['', '氏名太郎', '', '日本', null, '', '', '', null],
    ]);

    const rows = await parseClientImportWorkbook(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0].data).toBeUndefined();
    expect(rows[0].errors.length).toBeGreaterThan(0);
  });

  it('在留資格を入力した場合は在留期限も必須になる', async () => {
    const buffer = await buildWorkbookBuffer([
      ['株式会社サンプル', '山田太郎', '', '日本', null, '', '', '特定技能1号', null],
    ]);

    const rows = await parseClientImportWorkbook(buffer);
    expect(rows[0].data).toBeUndefined();
    expect(rows[0].errors.join()).toContain('在留期限');
  });

  it('完全に空の行はスキップする', async () => {
    const buffer = await buildWorkbookBuffer([
      ['株式会社サンプル', '山田太郎', '', '日本', null, '', '', '', null],
      ['', '', '', '', null, '', '', '', null],
    ]);

    const rows = await parseClientImportWorkbook(buffer);
    expect(rows).toHaveLength(1);
  });
});
