'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from './actions';

interface NewReportFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function NewReportForm({ action }: NewReportFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="reportPeriod">届出対象期間 *</Label>
        <Input
          id="reportPeriod"
          name="reportPeriod"
          placeholder="2026-Q3"
          required
          className="w-32"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '作成中...' : '新しい定期届出を作成'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
