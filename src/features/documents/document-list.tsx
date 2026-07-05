import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Document } from '@/generated/prisma/client';
import { deleteDocumentAction } from './actions';
import { getDocumentTypeLabel, REQUIRED_DOCUMENT_TYPES } from './constants';

interface DocumentListProps {
  clientId: string;
  foreignNationalId: string;
  documents: Document[];
  canEdit: boolean;
  canDownload: boolean;
}

export function DocumentList({
  clientId,
  foreignNationalId,
  documents,
  canEdit,
  canDownload,
}: DocumentListProps) {
  const uploadedTypes = new Set(documents.map((document) => document.documentType));
  const missingRequired = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type.key));

  return (
    <div className="space-y-3">
      {missingRequired.length > 0 && (
        <Alert variant="error">
          不足している必須書類: {missingRequired.map((type) => type.label).join('、')}
        </Alert>
      )}
      {documents.length === 0 ? (
        <p className="text-muted-foreground text-sm">アップロードされている書類はありません。</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th className="py-2 pr-4 font-medium">書類種別</th>
              <th className="py-2 pr-4 font-medium">ファイル名</th>
              <th className="py-2 pr-4 font-medium">アップロード日</th>
              <th className="py-2 pr-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-border border-b">
                <td className="py-2 pr-4">{getDocumentTypeLabel(document.documentType)}</td>
                <td className="py-2 pr-4">{document.storedFileName}</td>
                <td className="py-2 pr-4">{document.createdAt.toLocaleDateString('ja-JP')}</td>
                <td className="space-x-3 py-2 pr-4">
                  {canDownload && (
                    <a href={`/api/documents/${document.id}`} className="underline">
                      ダウンロード
                    </a>
                  )}
                  {canEdit && (
                    <form action={deleteDocumentAction} className="inline">
                      <input type="hidden" name="clientId" value={clientId} />
                      <input type="hidden" name="foreignNationalId" value={foreignNationalId} />
                      <input type="hidden" name="documentId" value={document.id} />
                      <Button type="submit" variant="danger" className="h-8 px-2 text-xs">
                        削除
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
