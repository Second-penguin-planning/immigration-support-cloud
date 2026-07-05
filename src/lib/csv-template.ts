import type {
  CsvTemplateDefinition,
  CsvTemplateFieldKey,
} from '@/features/csv-templates/constants';
import type { CsvColumn } from './csv';

/** テンプレートの1行分の元データ。Client + ForeignNational + 最新の在留資格を平坦化したもの。 */
export interface CsvTemplateRowSource {
  companyName: string;
  fullName: string;
  fullNameKana: string | null;
  nationality: string;
  birthDate: Date | null;
  passportNumber: string | null;
  residenceCardNumber: string | null;
  statusType: string | null;
  permitNumber: string | null;
  expiresAt: Date | null;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fieldValue(source: CsvTemplateRowSource, key: CsvTemplateFieldKey): string {
  switch (key) {
    case 'companyName':
      return source.companyName;
    case 'fullName':
      return source.fullName;
    case 'fullNameKana':
      return source.fullNameKana ?? '';
    case 'nationality':
      return source.nationality;
    case 'birthDate':
      return source.birthDate ? formatDate(source.birthDate) : '';
    case 'passportNumber':
      return source.passportNumber ?? '';
    case 'residenceCardNumber':
      return source.residenceCardNumber ?? '';
    case 'statusType':
      return source.statusType ?? '';
    case 'permitNumber':
      return source.permitNumber ?? '';
    case 'expiresAt':
      return source.expiresAt ? formatDate(source.expiresAt) : '';
    default:
      return '';
  }
}

export interface TemplateRowValidation {
  missingFieldLabels: string[];
}

/** テンプレートの必須列のうち、値が空のものを検出する。 */
export function validateTemplateRow(
  definition: CsvTemplateDefinition,
  source: CsvTemplateRowSource,
): TemplateRowValidation {
  const missingFieldLabels = definition.columns
    .filter((column) => column.required && !fieldValue(source, column.key).trim())
    .map((column) => column.label);
  return { missingFieldLabels };
}

/** テンプレートの列定義に沿って、`toCsv`/`toCsvWithBom` に渡せる列定義を組み立てる。 */
export function buildCsvColumns(
  definition: CsvTemplateDefinition,
): Array<CsvColumn<CsvTemplateRowSource>> {
  return definition.columns.map((column) => ({
    header: column.label,
    value: (source: CsvTemplateRowSource) => fieldValue(source, column.key),
  }));
}
