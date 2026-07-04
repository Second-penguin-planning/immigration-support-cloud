'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from './actions';

interface ResidenceStatusFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

export function ResidenceStatusForm({ action }: ResidenceStatusFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div>
        <Label htmlFor="statusType">在留資格 *</Label>
        <Input id="statusType" name="statusType" required className="w-48" />
      </div>
      <div>
        <Label htmlFor="permitNumber">許可番号</Label>
        <Input id="permitNumber" name="permitNumber" className="w-40" />
      </div>
      <div>
        <Label htmlFor="grantedAt">許可年月日</Label>
        <Input id="grantedAt" name="grantedAt" type="date" />
      </div>
      <div>
        <Label htmlFor="expiresAt">在留期限 *</Label>
        <Input id="expiresAt" name="expiresAt" type="date" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '追加中...' : '在留資格を追加'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
