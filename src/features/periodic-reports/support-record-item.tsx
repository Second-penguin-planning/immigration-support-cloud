'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateSupportRecordAction, type ActionState } from './actions';
import { getSupportTypeLabel } from './constants';
import type { SupportRecord } from '@/generated/prisma/client';

const initialState: ActionState = {};

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

export function SupportRecordItem({
  record,
  reportId,
}: {
  record: SupportRecord;
  reportId: string;
}) {
  const action = updateSupportRecordAction.bind(null, record.id, reportId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="border-border space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{getSupportTypeLabel(record.supportType)}</p>
        <Button type="submit" variant="secondary" disabled={isPending} className="h-8 px-3 text-xs">
          {isPending ? '更新中...' : '更新'}
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="implemented" defaultChecked={record.implemented} />
        実施済み
      </label>
      <div className="flex items-center gap-2">
        <label htmlFor={`implementedAt-${record.id}`} className="text-muted-foreground text-sm">
          実施日
        </label>
        <Input
          id={`implementedAt-${record.id}`}
          type="date"
          name="implementedAt"
          defaultValue={toDateInputValue(record.implementedAt)}
          className="w-40"
        />
      </div>
      <Textarea name="notes" defaultValue={record.notes ?? ''} rows={2} placeholder="備考" />
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
