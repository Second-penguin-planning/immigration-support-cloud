'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  applyExtractedFieldsAction,
  extractDocumentAction,
  type ApplyState,
  type ExtractState,
} from './actions';
import { EXTRACTED_FIELD_LABELS, type ExtractedFields } from './schema';

const initialExtractState: ExtractState = {};
const initialApplyState: ApplyState = {};

interface ExtractDocumentPanelProps {
  clientId: string;
  foreignNationalId: string;
  documentId: string;
  documentLabel: string;
}

export function ExtractDocumentPanel({
  clientId,
  foreignNationalId,
  documentId,
  documentLabel,
}: ExtractDocumentPanelProps) {
  const extractAction = extractDocumentAction.bind(null, documentId);
  const [extractState, extractFormAction, isExtracting] = useActionState(
    extractAction,
    initialExtractState,
  );

  const applyAction = applyExtractedFieldsAction.bind(null, clientId, foreignNationalId);
  const [applyState, applyFormAction, isApplying] = useActionState(applyAction, initialApplyState);

  const fieldEntries = extractState.extracted
    ? (
        Object.entries(extractState.extracted) as [
          keyof ExtractedFields,
          string | null | undefined,
        ][]
      ).filter((entry): entry is [keyof ExtractedFields, string] => Boolean(entry[1]))
    : [];

  return (
    <div className="border-border space-y-2 rounded-md border p-3">
      <form action={extractFormAction}>
        <Button
          type="submit"
          variant="secondary"
          disabled={isExtracting}
          className="h-8 px-3 text-xs"
        >
          {isExtracting ? '抽出中...' : `${documentLabel}をAIで抽出`}
        </Button>
      </form>

      {extractState.error && <Alert variant="error">{extractState.error}</Alert>}

      {fieldEntries.length > 0 && !applyState.success && (
        <form action={applyFormAction} className="space-y-2">
          <p className="text-muted-foreground text-sm">
            抽出結果を確認し、取り込む項目にチェックを入れてください。
          </p>
          <ul className="space-y-1 text-sm">
            {fieldEntries.map(([key, value]) => (
              <li key={key}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name={key} value={value} defaultChecked />
                  <span className="text-muted-foreground">{EXTRACTED_FIELD_LABELS[key]}:</span>
                  <span>{value}</span>
                </label>
              </li>
            ))}
          </ul>
          <Button type="submit" disabled={isApplying} className="h-8 px-3 text-xs">
            {isApplying ? '取込中...' : '選択した項目を取り込む'}
          </Button>
        </form>
      )}
      {applyState.success && <Alert variant="success">選択した項目を取り込みました。</Alert>}
    </div>
  );
}
