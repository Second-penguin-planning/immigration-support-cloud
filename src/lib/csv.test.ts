import { describe, expect, it } from 'vitest';
import { toCsv, toCsvWithBom } from './csv';

interface Row {
  name: string;
  note: string;
}

const columns = [
  { header: '氏名', value: (row: Row) => row.name },
  { header: '備考', value: (row: Row) => row.note },
];

describe('toCsv', () => {
  it('ヘッダー行とデータ行をCRLFで結合する', () => {
    const csv = toCsv<Row>([{ name: '山田太郎', note: 'OK' }], columns);
    expect(csv).toBe('氏名,備考\r\n山田太郎,OK');
  });

  it('カンマを含む値をダブルクォートで囲む', () => {
    const csv = toCsv<Row>([{ name: '山田, 太郎', note: '' }], columns);
    expect(csv).toContain('"山田, 太郎"');
  });

  it('ダブルクォートを含む値はエスケープして囲む', () => {
    const csv = toCsv<Row>([{ name: '"重要"', note: '' }], columns);
    expect(csv).toContain('"""重要"""');
  });

  it('null/undefinedは空文字として出力する', () => {
    const csv = toCsv<{ v: string | null | undefined }>(
      [{ v: null }, { v: undefined }],
      [{ header: 'v', value: (row) => row.v }],
    );
    expect(csv).toBe('v\r\n\r\n');
  });
});

describe('toCsvWithBom', () => {
  it('先頭にUTF-8 BOMを付与する', () => {
    const csv = toCsvWithBom<Row>([{ name: 'A', note: 'B' }], columns);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
