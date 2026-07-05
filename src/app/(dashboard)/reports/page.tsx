import { redirect } from 'next/navigation';
import { ReportSearchForm } from '@/features/periodic-reports/report-search-form';
import { ReportTable } from '@/features/periodic-reports/report-table';
import { periodicReportSearchSchema } from '@/features/periodic-reports/schema';
import { PeriodicReportStatus } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findClients } from '@/server/repositories/client-repository';
import { listPeriodicReports } from '@/server/repositories/periodic-report-repository';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const rawParams = await searchParams;
  const singleValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const rawFilters = {
    clientId: singleValue(rawParams.clientId),
    status: singleValue(rawParams.status),
    reportPeriod: singleValue(rawParams.reportPeriod),
  };
  const parsed = periodicReportSearchSchema.safeParse(rawFilters);
  const filters = parsed.success ? parsed.data : {};

  const [reports, clients] = await Promise.all([
    listPeriodicReports(session.user.tenantId, {
      clientId: filters.clientId,
      reportPeriod: filters.reportPeriod,
      status:
        filters.status && filters.status in PeriodicReportStatus
          ? (filters.status as PeriodicReportStatus)
          : undefined,
    }),
    findClients(session.user.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">定期届出一覧</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          特定技能定期届出のドラフト・提出履歴を確認できます。新規作成は各外国人の詳細画面から行います。
        </p>
      </div>
      <ReportSearchForm clients={clients} defaultValues={rawFilters} />
      <ReportTable reports={reports} />
    </div>
  );
}
