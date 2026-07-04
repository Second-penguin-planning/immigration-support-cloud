import ExcelJS from 'exceljs';
import { importRowSchema, type ImportRowValues } from '@/features/clients/schema';

/** Excelの見出し行と取り込み項目のマッピング。1行目にこの見出しがある列を読み取る。 */
const COLUMN_HEADERS = {
  companyName: '法人名',
  fullName: '氏名',
  fullNameKana: 'フリガナ',
  nationality: '国籍',
  birthDate: '生年月日',
  passportNumber: '旅券番号',
  residenceCardNumber: '在留カード番号',
  statusType: '在留資格',
  expiresAt: '在留期限',
} as const;

type ColumnKey = keyof typeof COLUMN_HEADERS;

export interface ParsedImportRow {
  rowNumber: number;
  raw: Record<string, string>;
  data?: ImportRowValues;
  errors: string[];
}

function cellToPlainValue(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return String(value.text);
    if ('result' in value) return value.result === undefined ? '' : String(value.result);
  }
  return String(value);
}

function buildColumnIndex(headerRow: ExcelJS.Row): Map<ColumnKey, number> {
  const columnIndexByKey = new Map<ColumnKey, number>();
  headerRow.eachCell((cell, colNumber) => {
    const headerText = cellToPlainValue(cell.value).trim();
    const key = (Object.keys(COLUMN_HEADERS) as ColumnKey[]).find(
      (candidate) => COLUMN_HEADERS[candidate] === headerText,
    );
    if (key) columnIndexByKey.set(key, colNumber);
  });
  return columnIndexByKey;
}

/**
 * アップロードされたExcelファイル(.xlsx)を解析し、行ごとにバリデーション結果を返す。
 * 1行目を見出し行として扱い、{@link COLUMN_HEADERS} と一致する見出しの列のみ読み取る。
 */
export async function parseClientImportWorkbook(buffer: ArrayBuffer): Promise<ParsedImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const columnIndexByKey = buildColumnIndex(worksheet.getRow(1));

  const rows: ParsedImportRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (row.cellCount === 0) continue;

    const raw: Record<string, string> = {};
    for (const [key, colNumber] of columnIndexByKey) {
      raw[key] = cellToPlainValue(row.getCell(colNumber).value).trim();
    }
    if (Object.values(raw).every((value) => value === '')) continue; // 空行はスキップ

    const parsed = importRowSchema.safeParse(raw);
    rows.push({
      rowNumber,
      raw,
      data: parsed.success ? parsed.data : undefined,
      errors: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
    });
  }

  return rows;
}
