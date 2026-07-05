import Link from 'next/link';
import type { PeriodicReportListItem } from '@/server/repositories/periodic-report-repository';
import { PERIODIC_REPORT_STATUS_LABEL } from './constants';

export function ReportTable({ reports }: { reports: PeriodicReportListItem[] }) {
  if (reports.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">該当する定期届出が見つかりませんでした。</p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-border text-muted-foreground border-b">
          <th className="py-2 pr-4 font-medium">対象期間</th>
          <th className="py-2 pr-4 font-medium">法人</th>
          <th className="py-2 pr-4 font-medium">外国人</th>
          <th className="py-2 pr-4 font-medium">ステータス</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => (
          <tr key={report.id} className="border-border border-b align-top">
            <td className="py-2 pr-4">
              <Link href={`/reports/${report.id}/edit`} className="font-medium underline">
                {report.reportPeriod}
              </Link>
            </td>
            <td className="py-2 pr-4">
              <Link href={`/clients/${report.foreignNational.client.id}`} className="underline">
                {report.foreignNational.client.companyName}
              </Link>
            </td>
            <td className="py-2 pr-4">
              <Link
                href={`/clients/${report.foreignNational.client.id}/foreign-nationals/${report.foreignNational.id}`}
                className="underline"
              >
                {report.foreignNational.fullName}
              </Link>
            </td>
            <td className="py-2 pr-4">{PERIODIC_REPORT_STATUS_LABEL[report.status]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
