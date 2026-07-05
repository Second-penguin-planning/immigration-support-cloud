/** 書類種別マスタ。必須書類は不足チェックの対象になる。 */
export const DOCUMENT_TYPES = [
  { key: 'residence_card_front', label: '在留カード（表面）', required: true },
  { key: 'residence_card_back', label: '在留カード（裏面）', required: true },
  { key: 'passport_copy', label: '旅券（パスポート）写し', required: true },
  { key: 'employment_contract', label: '雇用契約書', required: true },
  { key: 'other', label: 'その他', required: false },
] as const;

export type DocumentTypeKey = (typeof DOCUMENT_TYPES)[number]['key'];

export function getDocumentTypeLabel(key: string): string {
  return DOCUMENT_TYPES.find((type) => type.key === key)?.label ?? key;
}

export const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((type) => type.required);

export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
