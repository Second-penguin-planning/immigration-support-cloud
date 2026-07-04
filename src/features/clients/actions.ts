'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import {
  createClient,
  deleteClient,
  updateClient,
  type ClientInput,
} from '@/server/repositories/client-repository';
import { clientSchema, type ClientFormValues } from './schema';

export interface ActionState {
  error?: string;
}

function toClientInput(values: ClientFormValues): ClientInput {
  return {
    companyName: values.companyName,
    address: values.address ?? null,
    contactName: values.contactName ?? null,
    contactEmail: values.contactEmail ?? null,
    contactPhone: values.contactPhone ?? null,
    assignedUserId: values.assignedUserId ?? null,
    notes: values.notes ?? null,
  };
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const client = await createClient(session.user.tenantId, toClientInput(parsed.data));
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const updated = await updateClient(session.user.tenantId, clientId, toClientInput(parsed.data));
  if (!updated) {
    return { error: '対象の顧客が見つかりませんでした。' };
  }

  revalidatePath(`/clients/${clientId}`);
  return {};
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const clientId = formData.get('clientId');
  if (typeof clientId !== 'string') return;

  await deleteClient(session.user.tenantId, clientId);
  redirect('/clients');
}
