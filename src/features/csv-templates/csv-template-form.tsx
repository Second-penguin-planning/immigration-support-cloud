'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createCsvTemplateAction, type ActionState } from './actions';
import { OPTIONAL_CSV_TEMPLATE_FIELDS, REQUIRED_CSV_TEMPLATE_FIELDS } from './constants';

const initialState: ActionState = {};

export function CsvTemplateForm() {
  const [state, formAction, isPending] = useActionState(createCsvTemplateAction, initialState);

  return (
    <form action={formAction} className="border-border max-w-xl space-y-4 rounded-md border p-4">
      <div>
        <Label htmlFor="name">テンプレート名</Label>
        <Input id="name" name="name" required defaultValue="入管オンライン標準テンプレート" />
      </div>
      <div>
        <Label htmlFor="encoding">文字エンコーディング</Label>
        <Select id="encoding" name="encoding" defaultValue="shift_jis" className="w-full">
          <option value="shift_jis">Shift_JIS（入管オンラインシステム向け）</option>
          <option value="utf-8">UTF-8</option>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">必ず含まれる項目</p>
        <p className="text-muted-foreground text-sm">
          {REQUIRED_CSV_TEMPLATE_FIELDS.map((field) => field.label).join('、')}
        </p>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium">追加で含める任意項目</p>
        <div className="flex flex-wrap gap-3">
          {OPTIONAL_CSV_TEMPLATE_FIELDS.map((field) => (
            <label key={field.key} className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="optionalColumns" value={field.key} defaultChecked />
              {field.label}
            </label>
          ))}
        </div>
      </div>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">新しいバージョンを作成しました。</Alert>}
      <Button type="submit" disabled={isPending}>
        {isPending ? '作成中...' : '新しいバージョンとして保存'}
      </Button>
    </form>
  );
}
