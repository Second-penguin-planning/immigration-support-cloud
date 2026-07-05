import type { Document } from '@/generated/prisma/client';
import { getDocumentTypeLabel } from '@/features/documents/constants';
import { ExtractDocumentPanel } from './extract-document-panel';

interface AiAssistSectionProps {
  clientId: string;
  foreignNationalId: string;
  documents: Document[];
}

export function AiAssistSection({ clientId, foreignNationalId, documents }: AiAssistSectionProps) {
  if (documents.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        書類をアップロードすると、AIによる情報抽出が利用できます。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <ExtractDocumentPanel
          key={document.id}
          clientId={clientId}
          foreignNationalId={foreignNationalId}
          documentId={document.id}
          documentLabel={getDocumentTypeLabel(document.documentType)}
        />
      ))}
    </div>
  );
}
