'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState } from './actions';
import type { PeriodicReportDetail } from '@/server/repositories/periodic-report-repository';

interface ReportContentFormProps {
  report: PeriodicReportDetail;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function ReportContentForm({ report, action }: ReportContentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const basedOn = report.basedOnReport;

  return (
    <form action={formAction} className="space-y-4">
      <div className="border-border space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">従事する業務の内容</p>
        <p className="text-muted-foreground text-sm">
          前回（{basedOn?.reportPeriod ?? '前回データなし'}）: {basedOn?.jobDescription ?? '-'}
        </p>
        <Textarea
          name="jobDescription"
          defaultValue={report.jobDescription ?? ''}
          rows={2}
          disabled={report.status !== 'DRAFT'}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="jobDescriptionChanged"
            defaultChecked={report.jobDescriptionChanged}
            disabled={report.status !== 'DRAFT'}
          />
          前回から変更あり
        </label>
      </div>

      <div className="border-border space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">報酬の月額（円）</p>
        <p className="text-muted-foreground text-sm">
          前回（{basedOn?.reportPeriod ?? '前回データなし'}）:{' '}
          {basedOn?.salaryAmount != null ? basedOn.salaryAmount.toLocaleString('ja-JP') : '-'}
        </p>
        <Input
          type="number"
          name="salaryAmount"
          min={0}
          defaultValue={report.salaryAmount ?? ''}
          className="w-40"
          disabled={report.status !== 'DRAFT'}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="salaryChanged"
            defaultChecked={report.salaryChanged}
            disabled={report.status !== 'DRAFT'}
          />
          前回から変更あり
        </label>
      </div>

      <div className="border-border space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">労働時間・休日等の変更内容</p>
        <p className="text-muted-foreground text-sm">
          前回（{basedOn?.reportPeriod ?? '前回データなし'}）:{' '}
          {basedOn?.workingConditionsNotes ?? '-'}
        </p>
        <Textarea
          name="workingConditionsNotes"
          defaultValue={report.workingConditionsNotes ?? ''}
          rows={2}
          disabled={report.status !== 'DRAFT'}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="workingConditionsChanged"
            defaultChecked={report.workingConditionsChanged}
            disabled={report.status !== 'DRAFT'}
          />
          前回から変更あり
        </label>
      </div>

      <div>
        <Label htmlFor="notes">その他特記事項</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={report.notes ?? ''}
          rows={3}
          disabled={report.status !== 'DRAFT'}
        />
      </div>

      {report.status === 'DRAFT' && (
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中...' : '内容を保存'}
        </Button>
      )}
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
