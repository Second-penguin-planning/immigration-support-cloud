'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  commitImportAction,
  parseImportAction,
  type CommitState,
  type ParseState,
} from './import-actions';

const initialParseState: ParseState = { rows: [] };
const initialCommitState: CommitState = {};

export function ExcelImportForm() {
  const [parseState, parseFormAction, isParsing] = useActionState(
    parseImportAction,
    initialParseState,
  );
  const [commitState, commitFormAction, isCommitting] = useActionState(
    commitImportAction,
    initialCommitState,
  );

  const validRows = parseState.rows.filter((row) => row.data);
  const invalidRows = parseState.rows.filter((row) => !row.data);

  return (
    <div className="space-y-6">
      <form
        action={parseFormAction}
        className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
      >
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            Excelファイル（.xlsx）
          </label>
          <input id="file" name="file" type="file" accept=".xlsx" required className="text-sm" />
        </div>
        <Button type="submit" disabled={isParsing}>
          {isParsing ? '解析中...' : 'アップロードして解析'}
        </Button>
      </form>

      {parseState.error && <Alert variant="error">{parseState.error}</Alert>}

      {parseState.rows.length > 0 && !commitState.success && (
        <div className="space-y-4">
          <p className="text-sm">
            {parseState.rows.length}行中 <strong>{validRows.length}件</strong> が取込可能です
            {invalidRows.length > 0 && `（${invalidRows.length}件にエラーがあります）`}。
          </p>
          <div className="border-border max-h-96 overflow-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-border bg-muted text-muted-foreground border-b">
                  <th className="px-3 py-2 font-medium">行</th>
                  <th className="px-3 py-2 font-medium">法人名</th>
                  <th className="px-3 py-2 font-medium">氏名</th>
                  <th className="px-3 py-2 font-medium">国籍</th>
                  <th className="px-3 py-2 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {parseState.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-border border-b">
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.raw.companyName}</td>
                    <td className="px-3 py-2">{row.raw.fullName}</td>
                    <td className="px-3 py-2">{row.raw.nationality}</td>
                    <td className="px-3 py-2">
                      {row.data ? (
                        <span className="text-primary">OK</span>
                      ) : (
                        <span className="text-danger">{row.errors.join(' / ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validRows.length > 0 && (
            <form action={commitFormAction}>
              <input
                type="hidden"
                name="rows"
                value={JSON.stringify(validRows.map((row) => row.data))}
              />
              <Button type="submit" disabled={isCommitting}>
                {isCommitting ? '取込中...' : `${validRows.length}件を確定してインポート`}
              </Button>
            </form>
          )}
        </div>
      )}

      {commitState.error && <Alert variant="error">{commitState.error}</Alert>}
      {commitState.success && (
        <Alert variant="success">{commitState.count}件をインポートしました。</Alert>
      )}
    </div>
  );
}
