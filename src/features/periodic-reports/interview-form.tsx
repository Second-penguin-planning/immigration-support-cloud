'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState } from './actions';

interface InterviewFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function InterviewForm({ action }: InterviewFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="border-border space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="conductedAt">実施日 *</Label>
          <Input id="conductedAt" name="conductedAt" type="date" required />
        </div>
        <div>
          <Label htmlFor="conductedBy">面談者 *</Label>
          <Input id="conductedBy" name="conductedBy" required className="w-40" />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">内容メモ</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '追加中...' : '面談記録を追加'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
