import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button, LinkButton } from '@/components/ui/button';
import {
  deletePeriodicReportAction,
  submitPeriodicReportAction,
  updatePeriodicReportContentAction,
} from '@/features/periodic-reports/actions';
import { PERIODIC_REPORT_STATUS_LABEL } from '@/features/periodic-reports/constants';
import { ReportContentForm } from '@/features/periodic-reports/report-content-form';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findPeriodicReportById } from '@/server/repositories/periodic-report-repository';

export default async function PeriodicReportEditPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === UserRole.VIEWER) redirect('/reports');

  const report = await findPeriodicReportById(session.user.tenantId, reportId);
  if (!report) notFound();

  const clientId = report.foreignNational.client.id;
  const updateAction = updatePeriodicReportContentAction.bind(null, reportId, clientId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="text-muted-foreground text-sm underline">
          ← 定期届出一覧に戻る
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {report.foreignNational.fullName} — {report.reportPeriod} 定期届出
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {report.foreignNational.client.companyName} ／ ステータス:{' '}
            {PERIODIC_REPORT_STATUS_LABEL[report.status]}
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/reports/${reportId}/support`} variant="secondary">
            面談記録・支援実施状況
          </LinkButton>
          {report.status === 'DRAFT' && (
            <form action={deletePeriodicReportAction}>
              <input type="hidden" name="reportId" value={reportId} />
              <Button type="submit" variant="danger">
                削除
              </Button>
            </form>
          )}
        </div>
      </div>

      <ReportContentForm report={report} action={updateAction} />

      {report.status === 'DRAFT' && (
        <form action={submitPeriodicReportAction} className="border-border border-t pt-4">
          <input type="hidden" name="reportId" value={reportId} />
          <input type="hidden" name="clientId" value={clientId} />
          <p className="text-muted-foreground mb-2 text-sm">
            提出すると内容を編集できなくなります。面談記録・支援実施状況の入力を確認してから提出してください。
          </p>
          <Button type="submit">提出する</Button>
        </form>
      )}
    </div>
  );
}
