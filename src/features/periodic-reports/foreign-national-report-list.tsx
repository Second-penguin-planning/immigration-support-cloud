import Link from 'next/link';
import type { PeriodicReportListItem } from '@/server/repositories/periodic-report-repository';
import { PERIODIC_REPORT_STATUS_LABEL } from './constants';

export function ForeignNationalReportList({ reports }: { reports: PeriodicReportListItem[] }) {
  if (reports.length === 0) {
    return <p className="text-muted-foreground text-sm">定期届出はまだありません。</p>;
  }

  return (
    <ul className="space-y-1 text-sm">
      {reports.map((report) => (
        <li key={report.id}>
          <Link href={`/reports/${report.id}/edit`} className="underline">
            {report.reportPeriod}
          </Link>
          <span className="text-muted-foreground">
            {' '}
            （{PERIODIC_REPORT_STATUS_LABEL[report.status]}）
          </span>
        </li>
      ))}
    </ul>
  );
}
