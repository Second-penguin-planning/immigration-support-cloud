'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordResetAction, type ActionState } from './actions';

const initialState: ActionState = {};

export function RequestPasswordResetForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <Alert variant="success">
        入力されたメールアドレス宛にパスワード再設定用のメールを送信しました（該当アカウントが存在する場合）。
        メールをご確認ください。
      </Alert>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '送信中...' : '再設定メールを送信'}
      </Button>
    </form>
  );
}
