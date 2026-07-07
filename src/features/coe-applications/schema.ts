import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/** HTMLフォームの空文字を undefined として扱う任意入力の文字列。 */
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());

/** HTMLフォームの空文字を undefined として扱う任意入力の日付(`<input type="date">`)。 */
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const coeApplicationSchema = z.object({
  statusType: z.string().trim().min(1, '在留資格の種類を入力してください'),
  plannedSubmissionDate: optionalDate,
  notes: optionalText,
});

export type CoeApplicationFormValues = z.infer<typeof coeApplicationSchema>;

export const convertToResidenceStatusSchema = z.object({
  residenceCardNumber: z.string().trim().min(1, '在留カード番号を入力してください'),
  grantedAt: optionalDate,
  expiresAt: z.coerce.date({ error: () => '在留期限を正しい日付形式で入力してください' }),
});

export type ConvertToResidenceStatusFormValues = z.infer<typeof convertToResidenceStatusSchema>;
