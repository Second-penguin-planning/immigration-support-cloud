import { Prisma, PeriodicReportStatus } from '@/generated/prisma/client';
import { prisma } from '@/server/db/client';
import { SUPPORT_TYPES } from '@/features/periodic-reports/constants';

/**
 * 特定技能定期届出のデータアクセス層。
 * PeriodicReportはtenantIdを持たないため、`foreignNational.client.tenantId`経由で
 * テナントスコープを強制する。
 */

const PERIODIC_REPORT_LIST_INCLUDE = {
  foreignNational: {
    select: {
      id: true,
      fullName: true,
      client: { select: { id: true, companyName: true, tenantId: true } },
    },
  },
} satisfies Prisma.PeriodicReportInclude;

const PERIODIC_REPORT_DETAIL_INCLUDE = {
  ...PERIODIC_REPORT_LIST_INCLUDE,
  basedOnReport: {
    select: {
      id: true,
      reportPeriod: true,
      jobDescription: true,
      salaryAmount: true,
      workingConditionsNotes: true,
    },
  },
  interviews: { orderBy: { conductedAt: 'desc' as const } },
  supportRecords: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.PeriodicReportInclude;

export type PeriodicReportListItem = Prisma.PeriodicReportGetPayload<{
  include: typeof PERIODIC_REPORT_LIST_INCLUDE;
}>;

export type PeriodicReportDetail = Prisma.PeriodicReportGetPayload<{
  include: typeof PERIODIC_REPORT_DETAIL_INCLUDE;
}>;

export interface PeriodicReportFilter {
  clientId?: string;
  foreignNationalId?: string;
  status?: PeriodicReportStatus;
  reportPeriod?: string;
}

export async function listPeriodicReports(
  tenantId: string,
  filter: PeriodicReportFilter = {},
): Promise<PeriodicReportListItem[]> {
  return prisma.periodicReport.findMany({
    where: {
      foreignNational: {
        client: {
          tenantId,
          ...(filter.clientId ? { id: filter.clientId } : {}),
        },
        ...(filter.foreignNationalId ? { id: filter.foreignNationalId } : {}),
      },
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.reportPeriod ? { reportPeriod: { contains: filter.reportPeriod } } : {}),
    },
    include: PERIODIC_REPORT_LIST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export async function findPeriodicReportById(
  tenantId: string,
  id: string,
): Promise<PeriodicReportDetail | null> {
  return prisma.periodicReport.findFirst({
    where: { id, foreignNational: { client: { tenantId } } },
    include: PERIODIC_REPORT_DETAIL_INCLUDE,
  });
}

/**
 * 前回の届出データをコピーして新しいドラフトを作成する。
 * 対象の外国人に過去の届出が無ければ内容が空のドラフトを作成する。
 * 支援実施状況はSUPPORT_TYPESマスタの全項目分作成し、前回の実施有無を引き継ぐ。
 */
export async function createDraftPeriodicReport(
  tenantId: string,
  foreignNationalId: string,
  reportPeriod: string,
  createdByUserId: string | null,
): Promise<PeriodicReportDetail | null> {
  const foreignNational = await prisma.foreignNational.findFirst({
    where: { id: foreignNationalId, client: { tenantId } },
  });
  if (!foreignNational) return null;

  const previous = await prisma.periodicReport.findFirst({
    where: { foreignNationalId },
    include: { supportRecords: true },
    orderBy: { createdAt: 'desc' },
  });

  const created = await prisma.periodicReport.create({
    data: {
      foreignNationalId,
      reportPeriod,
      createdByUserId,
      basedOnReportId: previous?.id ?? null,
      jobDescription: previous?.jobDescription ?? null,
      salaryAmount: previous?.salaryAmount ?? null,
      workingConditionsNotes: previous?.workingConditionsNotes ?? null,
      supportRecords: {
        create: SUPPORT_TYPES.map((type) => {
          const previousRecord = previous?.supportRecords.find((r) => r.supportType === type.key);
          return {
            supportType: type.key,
            implemented: previousRecord?.implemented ?? false,
            implementedAt: previousRecord?.implementedAt ?? null,
          };
        }),
      },
    },
  });

  return findPeriodicReportById(tenantId, created.id);
}

export interface PeriodicReportContentInput {
  jobDescription?: string | null;
  jobDescriptionChanged: boolean;
  salaryAmount?: number | null;
  salaryChanged: boolean;
  workingConditionsNotes?: string | null;
  workingConditionsChanged: boolean;
  notes?: string | null;
}

/** ドラフト状態の届出のみ内容を更新できる。 */
export async function updatePeriodicReportContent(
  tenantId: string,
  id: string,
  data: PeriodicReportContentInput,
): Promise<boolean> {
  const { count } = await prisma.periodicReport.updateMany({
    where: { id, status: PeriodicReportStatus.DRAFT, foreignNational: { client: { tenantId } } },
    data,
  });
  return count > 0;
}

/** ドラフト状態の届出のみ提出できる。 */
export async function submitPeriodicReport(tenantId: string, id: string): Promise<boolean> {
  const { count } = await prisma.periodicReport.updateMany({
    where: { id, status: PeriodicReportStatus.DRAFT, foreignNational: { client: { tenantId } } },
    data: { status: PeriodicReportStatus.SUBMITTED, submittedAt: new Date() },
  });
  return count > 0;
}

/** ドラフト状態の届出のみ削除できる（提出済みは履歴として保持する）。 */
export async function deletePeriodicReport(tenantId: string, id: string): Promise<boolean> {
  const { count } = await prisma.periodicReport.deleteMany({
    where: { id, status: PeriodicReportStatus.DRAFT, foreignNational: { client: { tenantId } } },
  });
  return count > 0;
}

export interface InterviewInput {
  conductedAt: Date;
  conductedBy: string;
  notes?: string | null;
}

export async function addInterview(
  tenantId: string,
  periodicReportId: string,
  data: InterviewInput,
): Promise<boolean> {
  const report = await prisma.periodicReport.findFirst({
    where: { id: periodicReportId, foreignNational: { client: { tenantId } } },
  });
  if (!report) return false;

  await prisma.interview.create({ data: { ...data, periodicReportId } });
  return true;
}

export async function deleteInterview(tenantId: string, interviewId: string): Promise<boolean> {
  const { count } = await prisma.interview.deleteMany({
    where: { id: interviewId, periodicReport: { foreignNational: { client: { tenantId } } } },
  });
  return count > 0;
}

export interface SupportRecordUpdateInput {
  implemented: boolean;
  implementedAt?: Date | null;
  notes?: string | null;
}

export async function updateSupportRecord(
  tenantId: string,
  supportRecordId: string,
  data: SupportRecordUpdateInput,
): Promise<boolean> {
  const { count } = await prisma.supportRecord.updateMany({
    where: {
      id: supportRecordId,
      periodicReport: { foreignNational: { client: { tenantId } } },
    },
    data,
  });
  return count > 0;
}
