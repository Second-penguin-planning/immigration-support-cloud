'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DOCUMENT_TYPES } from './constants';
import { uploadDocumentAction, type ActionState } from './actions';

const initialState: ActionState = {};

export function UploadDocumentForm({
  clientId,
  foreignNationalId,
}: {
  clientId: string;
  foreignNationalId: string;
}) {
  const action = uploadDocumentAction.bind(null, clientId, foreignNationalId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div>
        <Label htmlFor="documentType">書類種別</Label>
        <Select id="documentType" name="documentType" defaultValue={DOCUMENT_TYPES[0].key}>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
              {type.required ? '（必須）' : ''}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="file">ファイル（PDF・JPEG・PNG、10MBまで）</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required
          className="text-sm"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'アップロード中...' : 'アップロード'}
      </Button>
      {state.error && <Alert variant="error">{state.error}</Alert>}
    </form>
  );
}
