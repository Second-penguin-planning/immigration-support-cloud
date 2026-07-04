import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/** HTMLフォームの空文字を undefined として扱う任意入力の文字列。 */
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());

/** HTMLフォームの空文字を undefined として扱う任意入力の日付(`<input type="date">`)。 */
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const clientSchema = z.object({
  companyName: z.string().trim().min(1, '法人名を入力してください'),
  address: optionalText,
  contactName: optionalText,
  contactEmail: z.preprocess(
    emptyToUndefined,
    z.string().trim().email('メールアドレスの形式が正しくありません').optional(),
  ),
  contactPhone: optionalText,
  assignedUserId: optionalText,
  notes: optionalText,
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const foreignNationalSchema = z.object({
  fullName: z.string().trim().min(1, '氏名を入力してください'),
  fullNameKana: optionalText,
  nationality: z.string().trim().min(1, '国籍を入力してください'),
  birthDate: optionalDate,
  passportNumber: optionalText,
  residenceCardNumber: optionalText,
});

export type ForeignNationalFormValues = z.infer<typeof foreignNationalSchema>;

export const residenceStatusSchema = z.object({
  statusType: z.string().trim().min(1, '在留資格を入力してください'),
  permitNumber: optionalText,
  grantedAt: optionalDate,
  expiresAt: z.coerce.date({ error: () => '在留期限を正しい日付形式で入力してください' }),
});

export type ResidenceStatusFormValues = z.infer<typeof residenceStatusSchema>;

export const clientSearchSchema = z.object({
  companyName: optionalText,
  fullName: optionalText,
  residenceCardNumber: optionalText,
  assignedUserId: optionalText,
  expiresFrom: optionalDate,
  expiresTo: optionalDate,
});

export type ClientSearchValues = z.infer<typeof clientSearchSchema>;

/** Excel一括取込1行分。法人名+外国人情報+(任意で)在留資格をまとめて表す。 */
export const importRowSchema = z
  .object({
    companyName: z.string().trim().min(1, '法人名を入力してください'),
    fullName: z.string().trim().min(1, '氏名を入力してください'),
    fullNameKana: optionalText,
    nationality: z.string().trim().min(1, '国籍を入力してください'),
    birthDate: optionalDate,
    passportNumber: optionalText,
    residenceCardNumber: optionalText,
    statusType: optionalText,
    expiresAt: optionalDate,
  })
  .refine((data) => !data.statusType || data.expiresAt, {
    message: '在留資格を入力する場合は在留期限も入力してください',
    path: ['expiresAt'],
  });

export type ImportRowValues = z.infer<typeof importRowSchema>;
