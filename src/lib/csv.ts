export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 汎用CSV生成（改行はCRLF、カンマ・引用符・改行を含む値はダブルクォートで囲む）。 */
export function toCsv<T>(rows: T[], columns: Array<CsvColumn<T>>): string {
  const headerLine = columns.map((column) => escapeCsvField(column.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCsvField(String(column.value(row) ?? ''))).join(','),
  );
  return [headerLine, ...dataLines].join('\r\n');
}

const UTF8_BOM = String.fromCharCode(0xfeff);

/** Excelで文字化けせずに開けるよう、UTF-8のCSV先頭にBOMを付与する。 */
export function toCsvWithBom<T>(rows: T[], columns: Array<CsvColumn<T>>): string {
  return UTF8_BOM + toCsv(rows, columns);
}
