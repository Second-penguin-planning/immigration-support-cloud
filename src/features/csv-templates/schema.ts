import { z } from 'zod';
import { OPTIONAL_CSV_TEMPLATE_FIELDS } from './constants';

const OPTIONAL_FIELD_KEYS = OPTIONAL_CSV_TEMPLATE_FIELDS.map((field) => field.key);

export const csvTemplateFormSchema = z.object({
  name: z.string().trim().min(1, 'テンプレート名を入力してください'),
  encoding: z.enum(['utf-8', 'shift_jis']),
  optionalColumns: z
    .array(z.string().refine((value) => (OPTIONAL_FIELD_KEYS as string[]).includes(value)))
    .default([]),
});

export type CsvTemplateFormValues = z.infer<typeof csvTemplateFormSchema>;
