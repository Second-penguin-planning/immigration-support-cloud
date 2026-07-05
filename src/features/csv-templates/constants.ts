/**
 * 入管オンライン提出用CSVで選択可能な標準フィールド。
 * required=true の項目はテンプレートから外せない(常に出力対象)。
 */
export const CSV_TEMPLATE_FIELDS = [
  { key: 'companyName', label: '法人名', required: true },
  { key: 'fullName', label: '氏名', required: true },
  { key: 'fullNameKana', label: 'フリガナ', required: false },
  { key: 'nationality', label: '国籍', required: true },
  { key: 'birthDate', label: '生年月日', required: false },
  { key: 'passportNumber', label: '旅券番号', required: false },
  { key: 'residenceCardNumber', label: '在留カード番号', required: true },
  { key: 'statusType', label: '在留資格', required: true },
  { key: 'permitNumber', label: '許可番号', required: false },
  { key: 'expiresAt', label: '在留期限', required: true },
] as const;

export type CsvTemplateFieldKey = (typeof CSV_TEMPLATE_FIELDS)[number]['key'];

export const REQUIRED_CSV_TEMPLATE_FIELDS = CSV_TEMPLATE_FIELDS.filter((field) => field.required);
export const OPTIONAL_CSV_TEMPLATE_FIELDS = CSV_TEMPLATE_FIELDS.filter((field) => !field.required);

export interface CsvTemplateColumn {
  key: CsvTemplateFieldKey;
  label: string;
  required: boolean;
}

export interface CsvTemplateDefinition {
  encoding: 'utf-8' | 'shift_jis';
  columns: CsvTemplateColumn[];
}
