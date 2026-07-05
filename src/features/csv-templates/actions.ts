'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import { createCsvTemplateVersion } from '@/server/repositories/csv-template-repository';
import {
  CSV_TEMPLATE_FIELDS,
  REQUIRED_CSV_TEMPLATE_FIELDS,
  type CsvTemplateColumn,
  type CsvTemplateDefinition,
} from './constants';
import { csvTemplateFormSchema } from './schema';

export interface ActionState {
  error?: string;
  success?: boolean;
}

export async function createCsvTemplateAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN);

  const parsed = csvTemplateFormSchema.safeParse({
    name: formData.get('name'),
    encoding: formData.get('encoding'),
    optionalColumns: formData.getAll('optionalColumns'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' };
  }

  const selectedKeys = new Set<string>([
    ...REQUIRED_CSV_TEMPLATE_FIELDS.map((field) => field.key),
    ...parsed.data.optionalColumns,
  ]);
  const columns: CsvTemplateColumn[] = CSV_TEMPLATE_FIELDS.filter((field) =>
    selectedKeys.has(field.key),
  ).map((field) => ({ key: field.key, label: field.label, required: field.required }));

  const definition: CsvTemplateDefinition = { encoding: parsed.data.encoding, columns };

  await createCsvTemplateVersion(session.user.tenantId, parsed.data.name, definition);

  revalidatePath('/settings/csv-templates');
  return { success: true };
}
