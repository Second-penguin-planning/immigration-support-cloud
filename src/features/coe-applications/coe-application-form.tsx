'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from './actions';

interface CoeApplicationFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function CoeApplicationForm({ action }: CoeApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div>
        <Label htmlFor="coeStatusType">申請する在留資格 *</Label>
        <Input id="coeStatusType" name="statusType" required className="w-48" />
      </div>
      <div>
        <Label htmlFor="plannedSubmissionDate">申請予定日</Label>
        <Input id="plannedSubmissionDate" name="plannedSubmissionDate" type="date" />
      </div>
      <div>
        <Label htmlFor="coeNotes">備考</Label>
        <Input id="coeNotes" name="notes" className="w-48" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '追加中...' : '交付申請を追加'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
