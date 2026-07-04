'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from './actions';

export interface ForeignNationalFormDefaultValues {
  fullName?: string;
  fullNameKana?: string | null;
  nationality?: string;
  birthDate?: Date | null;
  passportNumber?: string | null;
  residenceCardNumber?: string | null;
}

interface ForeignNationalFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: ForeignNationalFormDefaultValues;
  submitLabel: string;
}

const initialState: ActionState = {};

function toDateInputValue(value?: Date | null): string {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

export function ForeignNationalForm({
  action,
  defaultValues,
  submitLabel,
}: ForeignNationalFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">氏名 *</Label>
          <Input id="fullName" name="fullName" required defaultValue={defaultValues?.fullName} />
        </div>
        <div>
          <Label htmlFor="fullNameKana">フリガナ</Label>
          <Input
            id="fullNameKana"
            name="fullNameKana"
            defaultValue={defaultValues?.fullNameKana ?? ''}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nationality">国籍 *</Label>
          <Input
            id="nationality"
            name="nationality"
            required
            defaultValue={defaultValues?.nationality}
          />
        </div>
        <div>
          <Label htmlFor="birthDate">生年月日</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.birthDate)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="passportNumber">旅券番号</Label>
          <Input
            id="passportNumber"
            name="passportNumber"
            defaultValue={defaultValues?.passportNumber ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="residenceCardNumber">在留カード番号</Label>
          <Input
            id="residenceCardNumber"
            name="residenceCardNumber"
            defaultValue={defaultValues?.residenceCardNumber ?? ''}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        旅券番号・在留カード番号は暗号化して保存されます。
      </p>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : submitLabel}
      </Button>
    </form>
  );
}
