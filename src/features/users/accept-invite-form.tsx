'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_MIN_LENGTH } from '@/features/auth/schema';
import type { ActionState } from '@/features/auth/actions';
import { acceptInviteAction } from './actions';

const initialState: ActionState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const action = acceptInviteAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <div className="space-y-4">
        <Alert variant="success">パスワードを設定しました。ログインしてください。</Alert>
        <p className="text-center text-sm">
          <Link href="/login" className="underline">
            ログインページへ
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">パスワード（確認）</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? '設定中...' : 'パスワードを設定してアカウントを有効化'}
      </Button>
    </form>
  );
}
