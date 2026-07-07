'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from './actions';

interface ApproveCoeApplicationFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const initialState: ActionState = {};

/** 交付申請を「交付」として確定し、実際の在留資格レコードへ変換するための入力フォーム。 */
export function ApproveCoeApplicationForm({ action }: ApproveCoeApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="border-border bg-muted/30 flex flex-wrap items-end gap-3 rounded-md border p-3"
    >
      <p className="text-muted-foreground w-full text-xs">
        交付されたら、在留カード番号と在留期限を入力して在留資格として確定してください。
      </p>
      <div>
        <Label htmlFor="residenceCardNumber">在留カード番号 *</Label>
        <Input id="residenceCardNumber" name="residenceCardNumber" required className="w-48" />
      </div>
      <div>
        <Label htmlFor="grantedAt">許可年月日</Label>
        <Input id="grantedAt" name="grantedAt" type="date" />
      </div>
      <div>
        <Label htmlFor="expiresAt">在留期限 *</Label>
        <Input id="expiresAt" name="expiresAt" type="date" required />
      </div>
      <Button type="submit" disabled={isPending} className="h-8 px-3 text-xs">
        {isPending ? '確定中...' : '交付として確定'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
