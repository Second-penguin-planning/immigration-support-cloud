import { z } from 'zod';

/**
 * AIによる書類抽出結果のスキーマ。AIの応答はそのまま信用せず、必ずこの形に検証してから扱う。
 * 全項目optional/nullable: 書類の種類によって写っている情報が異なるため。
 */
export const extractedFieldsSchema = z.object({
  fullName: z.string().trim().min(1).nullable().optional(),
  fullNameKana: z.string().trim().min(1).nullable().optional(),
  nationality: z.string().trim().min(1).nullable().optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  passportNumber: z.string().trim().min(1).nullable().optional(),
  residenceCardNumber: z.string().trim().min(1).nullable().optional(),
  statusType: z.string().trim().min(1).nullable().optional(),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export type ExtractedFields = z.infer<typeof extractedFieldsSchema>;

export const EXTRACTED_FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  fullName: '氏名',
  fullNameKana: 'フリガナ',
  nationality: '国籍',
  birthDate: '生年月日',
  passportNumber: '旅券番号',
  residenceCardNumber: '在留カード番号',
  statusType: '在留資格',
  expiresAt: '在留期限',
};
