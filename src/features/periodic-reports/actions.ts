'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import {
  addInterview,
  createDraftPeriodicReport,
  deleteInterview,
  deletePeriodicReport,
  submitPeriodicReport,
  updatePeriodicReportContent,
  updateSupportRecord,
} from '@/server/repositories/periodic-report-repository';
import {
  interviewSchema,
  newPeriodicReportSchema,
  periodicReportContentSchema,
  supportRecordUpdateSchema,
} from './schema';

export interface ActionState {
  error?: string;
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

export async function createDraftPeriodicReportAction(
  clientId: string,
  foreignNationalId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = newPeriodicReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const report = await createDraftPeriodicReport(
    session.user.tenantId,
    foreignNationalId,
    parsed.data.reportPeriod,
    session.user.id,
  );
  if (!report) {
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  redirect(`/reports/${report.id}/edit?clientId=${clientId}`);
}

export async function updatePeriodicReportContentAction(
  reportId: string,
  clientId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = periodicReportContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const updated = await updatePeriodicReportContent(session.user.tenantId, reportId, {
    jobDescription: parsed.data.jobDescription ?? null,
    jobDescriptionChanged: parsed.data.jobDescriptionChanged,
    salaryAmount: parsed.data.salaryAmount ?? null,
    salaryChanged: parsed.data.salaryChanged,
    workingConditionsNotes: parsed.data.workingConditionsNotes ?? null,
    workingConditionsChanged: parsed.data.workingConditionsChanged,
    notes: parsed.data.notes ?? null,
  });
  if (!updated) {
    return { error: '下書き状態の届出のみ編集できます。' };
  }

  revalidatePath(`/reports/${reportId}/edit`);
  return {};
}

export async function submitPeriodicReportAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const reportId = formData.get('reportId');
  const clientId = formData.get('clientId');
  if (typeof reportId !== 'string') return;

  await submitPeriodicReport(session.user.tenantId, reportId);
  revalidatePath(`/reports/${reportId}/edit`);
  redirect(typeof clientId === 'string' ? `/reports?clientId=${clientId}` : '/reports');
}

export async function deletePeriodicReportAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const reportId = formData.get('reportId');
  if (typeof reportId !== 'string') return;

  await deletePeriodicReport(session.user.tenantId, reportId);
  redirect('/reports');
}

export async function addInterviewAction(
  reportId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = interviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const added = await addInterview(session.user.tenantId, reportId, {
    conductedAt: parsed.data.conductedAt,
    conductedBy: parsed.data.conductedBy,
    notes: parsed.data.notes ?? null,
  });
  if (!added) {
    return { error: '対象の届出が見つかりませんでした。' };
  }

  revalidatePath(`/reports/${reportId}/support`);
  return {};
}

export async function deleteInterviewAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const interviewId = formData.get('interviewId');
  const reportId = formData.get('reportId');
  if (typeof interviewId !== 'string' || typeof reportId !== 'string') return;

  await deleteInterview(session.user.tenantId, interviewId);
  revalidatePath(`/reports/${reportId}/support`);
}

export async function updateSupportRecordAction(
  supportRecordId: string,
  reportId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = supportRecordUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const updated = await updateSupportRecord(session.user.tenantId, supportRecordId, {
    implemented: parsed.data.implemented,
    implementedAt: parsed.data.implementedAt ?? null,
    notes: parsed.data.notes ?? null,
  });
  if (!updated) {
    return { error: '対象の支援実施状況が見つかりませんでした。' };
  }

  revalidatePath(`/reports/${reportId}/support`);
  return {};
}
