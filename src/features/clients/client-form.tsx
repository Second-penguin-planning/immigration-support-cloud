'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState } from './actions';

export interface ClientFormDefaultValues {
  companyName?: string;
  address?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  assignedUserId?: string | null;
  notes?: string | null;
}

interface ClientFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  users: { id: string; name: string }[];
  defaultValues?: ClientFormDefaultValues;
  submitLabel: string;
}

const initialState: ActionState = {};

export function ClientForm({ action, users, defaultValues, submitLabel }: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <Label htmlFor="companyName">法人名 *</Label>
        <Input
          id="companyName"
          name="companyName"
          required
          defaultValue={defaultValues?.companyName}
        />
      </div>
      <div>
        <Label htmlFor="address">所在地</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactName">先方担当者名</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={defaultValues?.contactName ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="contactEmail">連絡先メールアドレス</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={defaultValues?.contactEmail ?? ''}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="contactPhone">連絡先電話番号</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          defaultValue={defaultValues?.contactPhone ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="assignedUserId">社内担当者</Label>
        <Select
          id="assignedUserId"
          name="assignedUserId"
          defaultValue={defaultValues?.assignedUserId ?? ''}
          className="w-full"
        >
          <option value="">未設定</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">メモ</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={defaultValues?.notes ?? ''} />
      </div>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : submitLabel}
      </Button>
    </form>
  );
}
