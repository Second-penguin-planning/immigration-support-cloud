import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

/** HTMLフォームの空文字を undefined として扱う任意入力の文字列。 */
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());

/** HTMLフォームの空文字を undefined として扱う任意入力の日付(`<input type="date">`)。 */
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

/** チェックボックスの入力(未チェック時はフォームに項目自体が現れない)。 */
const checkbox = z.preprocess((value) => value === 'on' || value === true, z.boolean());

export const newPeriodicReportSchema = z.object({
  reportPeriod: z
    .string()
    .trim()
    .regex(/^\d{4}-Q[1-4]$/, '届出対象期間は「2026-Q3」の形式で入力してください'),
});

export type NewPeriodicReportFormValues = z.infer<typeof newPeriodicReportSchema>;

export const periodicReportContentSchema = z.object({
  jobDescription: optionalText,
  jobDescriptionChanged: checkbox,
  salaryAmount: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().nonnegative('報酬の月額は0以上の整数で入力してください').optional(),
  ),
  salaryChanged: checkbox,
  workingConditionsNotes: optionalText,
  workingConditionsChanged: checkbox,
  notes: optionalText,
});

export type PeriodicReportContentFormValues = z.infer<typeof periodicReportContentSchema>;

export const interviewSchema = z.object({
  conductedAt: z.coerce.date({ error: () => '実施日を正しい日付形式で入力してください' }),
  conductedBy: z.string().trim().min(1, '面談者を入力してください'),
  notes: optionalText,
});

export type InterviewFormValues = z.infer<typeof interviewSchema>;

export const supportRecordUpdateSchema = z.object({
  implemented: checkbox,
  implementedAt: optionalDate,
  notes: optionalText,
});

export type SupportRecordUpdateFormValues = z.infer<typeof supportRecordUpdateSchema>;

export const periodicReportSearchSchema = z.object({
  clientId: optionalText,
  foreignNationalId: optionalText,
  status: optionalText,
  reportPeriod: optionalText,
});

export type PeriodicReportSearchValues = z.infer<typeof periodicReportSearchSchema>;
