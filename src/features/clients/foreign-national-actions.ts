'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import {
  createForeignNational,
  deleteForeignNational,
  updateForeignNational,
  type ForeignNationalInput,
} from '@/server/repositories/foreign-national-repository';
import { foreignNationalSchema, type ForeignNationalFormValues } from './schema';
import type { ActionState } from './actions';

function toForeignNationalInput(values: ForeignNationalFormValues): ForeignNationalInput {
  return {
    fullName: values.fullName,
    fullNameKana: values.fullNameKana ?? null,
    nationality: values.nationality,
    birthDate: values.birthDate ?? null,
    passportNumber: values.passportNumber ?? null,
    residenceCardNumber: values.residenceCardNumber ?? null,
  };
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

export async function createForeignNationalAction(
  clientId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = foreignNationalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const created = await createForeignNational(
    session.user.tenantId,
    clientId,
    toForeignNationalInput(parsed.data),
  );
  if (!created) {
    return { error: '対象の顧客が見つかりませんでした。' };
  }

  redirect(`/clients/${clientId}/foreign-nationals/${created.id}`);
}

export async function updateForeignNationalAction(
  clientId: string,
  foreignNationalId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = foreignNationalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const updated = await updateForeignNational(
    session.user.tenantId,
    foreignNationalId,
    toForeignNationalInput(parsed.data),
  );
  if (!updated) {
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
  return {};
}

export async function deleteForeignNationalAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const clientId = formData.get('clientId');
  const foreignNationalId = formData.get('foreignNationalId');
  if (typeof clientId !== 'string' || typeof foreignNationalId !== 'string') return;

  await deleteForeignNational(session.user.tenantId, foreignNationalId);
  redirect(`/clients/${clientId}`);
}
