'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from '@/features/auth/actions';
import { inviteUserAction } from './actions';
import { ROLE_LABEL, ROLE_OPTIONS } from './constants';

const initialState: ActionState = {};

export function InviteUserForm() {
  const [state, formAction, isPending] = useActionState(inviteUserAction, initialState);

  return (
    <form
      action={formAction}
      className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div>
        <Label htmlFor="invite-name">氏名</Label>
        <Input id="invite-name" name="name" required className="w-40" />
      </div>
      <div>
        <Label htmlFor="invite-email">メールアドレス</Label>
        <Input id="invite-email" name="email" type="email" required className="w-56" />
      </div>
      <div>
        <Label htmlFor="invite-role">権限</Label>
        <select
          id="invite-role"
          name="role"
          defaultValue={ROLE_OPTIONS[1]}
          className="border-border bg-background h-10 rounded-md border px-3 text-sm"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '招待中...' : 'ユーザーを招待'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">招待メールを送信しました。</Alert>}
    </form>
  );
}
