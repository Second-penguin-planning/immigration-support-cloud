import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PERIODIC_REPORT_STATUS_LABEL } from './constants';
import type { PeriodicReportSearchValues } from './schema';

interface ReportSearchFormProps {
  clients: { id: string; companyName: string }[];
  defaultValues: Partial<Record<keyof PeriodicReportSearchValues, string>>;
}

export function ReportSearchForm({ clients, defaultValues }: ReportSearchFormProps) {
  return (
    <form
      method="get"
      className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div>
        <Label htmlFor="clientId">法人</Label>
        <select
          id="clientId"
          name="clientId"
          defaultValue={defaultValues.clientId ?? ''}
          className="border-border bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="">すべて</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.companyName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="status">ステータス</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues.status ?? ''}
          className="border-border bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="">すべて</option>
          {Object.entries(PERIODIC_REPORT_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="reportPeriod">届出対象期間</Label>
        <Input
          id="reportPeriod"
          name="reportPeriod"
          placeholder="例: 2026-Q3"
          defaultValue={defaultValues.reportPeriod}
          className="w-32"
        />
      </div>
      <Button type="submit">検索</Button>
    </form>
  );
}
