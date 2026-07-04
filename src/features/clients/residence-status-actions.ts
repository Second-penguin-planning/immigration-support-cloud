'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import {
  createResidenceStatus,
  deleteResidenceStatus,
  type ResidenceStatusInput,
} from '@/server/repositories/residence-status-repository';
import { residenceStatusSchema, type ResidenceStatusFormValues } from './schema';
import type { ActionState } from './actions';

function toResidenceStatusInput(values: ResidenceStatusFormValues): ResidenceStatusInput {
  return {
    statusType: values.statusType,
    permitNumber: values.permitNumber ?? null,
    grantedAt: values.grantedAt ?? null,
    expiresAt: values.expiresAt,
  };
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

export async function createResidenceStatusAction(
  clientId: string,
  foreignNationalId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = residenceStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const created = await createResidenceStatus(
    session.user.tenantId,
    foreignNationalId,
    toResidenceStatusInput(parsed.data),
  );
  if (!created) {
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
  return {};
}

export async function deleteResidenceStatusAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const clientId = formData.get('clientId');
  const foreignNationalId = formData.get('foreignNationalId');
  const residenceStatusId = formData.get('residenceStatusId');
  if (
    typeof clientId !== 'string' ||
    typeof foreignNationalId !== 'string' ||
    typeof residenceStatusId !== 'string'
  ) {
    return;
  }

  await deleteResidenceStatus(session.user.tenantId, residenceStatusId);
  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
}
