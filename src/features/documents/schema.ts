import { z } from 'zod';
import { DOCUMENT_TYPES } from './constants';

const DOCUMENT_TYPE_KEYS = DOCUMENT_TYPES.map((type) => type.key);

export const uploadDocumentSchema = z.object({
  documentType: z
    .string()
    .refine(
      (value) => (DOCUMENT_TYPE_KEYS as string[]).includes(value),
      '書類種別を選択してください',
    ),
});

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;
