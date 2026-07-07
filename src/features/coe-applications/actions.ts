'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { CoeApplicationStatus } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import {
  approveAndConvertCoeApplication,
  createCoeApplication,
  deleteCoeApplication,
  updateCoeApplicationStatus,
  type CoeApplicationInput,
} from '@/server/repositories/coe-application-repository';
import {
  coeApplicationSchema,
  convertToResidenceStatusSchema,
  type CoeApplicationFormValues,
} from './schema';

export interface ActionState {
  error?: string;
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

function toCoeApplicationInput(values: CoeApplicationFormValues): CoeApplicationInput {
  return {
    statusType: values.statusType,
    plannedSubmissionDate: values.plannedSubmissionDate ?? null,
    notes: values.notes ?? null,
  };
}

export async function createCoeApplicationAction(
  clientId: string,
  foreignNationalId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = coeApplicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const created = await createCoeApplication(
    session.user.tenantId,
    foreignNationalId,
    session.user.id,
    toCoeApplicationInput(parsed.data),
  );
  if (!created) {
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
  return {};
}

async function transitionStatus(
  clientId: string,
  foreignNationalId: string,
  formData: FormData,
  status: CoeApplicationStatus,
): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const coeApplicationId = formData.get('coeApplicationId');
  if (typeof coeApplicationId !== 'string') return;

  await updateCoeApplicationStatus(session.user.tenantId, coeApplicationId, status);
  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
}

export async function markCoeApplicationSubmittedAction(
  clientId: string,
  foreignNationalId: string,
  formData: FormData,
): Promise<void> {
  await transitionStatus(clientId, foreignNationalId, formData, CoeApplicationStatus.SUBMITTED);
}

export async function markCoeApplicationRejectedAction(
  clientId: string,
  foreignNationalId: string,
  formData: FormData,
): Promise<void> {
  await transitionStatus(clientId, foreignNationalId, formData, CoeApplicationStatus.REJECTED);
}

export async function markCoeApplicationWithdrawnAction(
  clientId: string,
  foreignNationalId: string,
  formData: FormData,
): Promise<void> {
  await transitionStatus(clientId, foreignNationalId, formData, CoeApplicationStatus.WITHDRAWN);
}

export async function deleteCoeApplicationAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const clientId = formData.get('clientId');
  const foreignNationalId = formData.get('foreignNationalId');
  const coeApplicationId = formData.get('coeApplicationId');
  if (
    typeof clientId !== 'string' ||
    typeof foreignNationalId !== 'string' ||
    typeof coeApplicationId !== 'string'
  ) {
    return;
  }

  await deleteCoeApplication(session.user.tenantId, coeApplicationId);
  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
}

export async function approveAndConvertCoeApplicationAction(
  clientId: string,
  foreignNationalId: string,
  coeApplicationId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = convertToResidenceStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const converted = await approveAndConvertCoeApplication(session.user.tenantId, coeApplicationId, {
    residenceCardNumber: parsed.data.residenceCardNumber,
    grantedAt: parsed.data.grantedAt ?? null,
    expiresAt: parsed.data.expiresAt,
  });
  if (!converted) {
    return { error: '対象の交付申請が見つからないか、既に交付処理済みです。' };
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
  return {};
}
