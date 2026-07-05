import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { addInterviewAction } from '@/features/periodic-reports/actions';
import { InterviewForm } from '@/features/periodic-reports/interview-form';
import { InterviewList } from '@/features/periodic-reports/interview-list';
import { SupportRecordItem } from '@/features/periodic-reports/support-record-item';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findPeriodicReportById } from '@/server/repositories/periodic-report-repository';

export default async function PeriodicReportSupportPage({
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

  const addInterview = addInterviewAction.bind(null, reportId);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/reports/${reportId}/edit`}
          className="text-muted-foreground text-sm underline"
        >
          ← {report.reportPeriod} の届出編集に戻る
        </Link>
      </div>

      <h1 className="text-xl font-semibold">
        {report.foreignNational.fullName} — 面談記録・支援実施状況
      </h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">面談記録</h2>
        <InterviewForm action={addInterview} />
        <InterviewList interviews={report.interviews} reportId={reportId} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">支援実施状況</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {report.supportRecords.map((record) => (
            <SupportRecordItem key={record.id} record={record} reportId={reportId} />
          ))}
        </div>
      </div>
    </div>
  );
}
