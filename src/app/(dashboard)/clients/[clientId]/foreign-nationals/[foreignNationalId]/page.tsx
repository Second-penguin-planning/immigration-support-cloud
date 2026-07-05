import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DocumentList } from '@/features/documents/document-list';
import { UploadDocumentForm } from '@/features/documents/upload-document-form';
import { AiAssistSection } from '@/features/ai-assist/ai-assist-section';
import { AnomalyList } from '@/features/ai-assist/anomaly-list';
import {
  deleteForeignNationalAction,
  updateForeignNationalAction,
} from '@/features/clients/foreign-national-actions';
import { ForeignNationalForm } from '@/features/clients/foreign-national-form';
import { createResidenceStatusAction } from '@/features/clients/residence-status-actions';
import { ResidenceStatusForm } from '@/features/clients/residence-status-form';
import { ResidenceStatusTable } from '@/features/clients/residence-status-table';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findForeignNationalById } from '@/server/repositories/foreign-national-repository';
import { listDocuments } from '@/server/repositories/document-repository';

export default async function ForeignNationalDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; foreignNationalId: string }>;
}) {
  const { clientId, foreignNationalId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const foreignNational = await findForeignNationalById(session.user.tenantId, foreignNationalId);
  if (!foreignNational || foreignNational.client.id !== clientId) notFound();

  const canEdit = session.user.role !== UserRole.VIEWER;
  const canDownload = session.user.role !== UserRole.VIEWER;
  const updateAction = updateForeignNationalAction.bind(null, clientId, foreignNationalId);
  const createStatusAction = createResidenceStatusAction.bind(null, clientId, foreignNationalId);
  const documents = await listDocuments(session.user.tenantId, foreignNationalId);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/clients/${clientId}`} className="text-muted-foreground text-sm underline">
          ← {foreignNational.client.companyName} に戻る
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{foreignNational.fullName}</h1>
        {canEdit && (
          <form action={deleteForeignNationalAction}>
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="foreignNationalId" value={foreignNational.id} />
            <Button type="submit" variant="danger">
              削除
            </Button>
          </form>
        )}
      </div>

      {canEdit ? (
        <ForeignNationalForm
          action={updateAction}
          defaultValues={{
            fullName: foreignNational.fullName,
            fullNameKana: foreignNational.fullNameKana,
            nationality: foreignNational.nationality,
            birthDate: foreignNational.birthDate,
            passportNumber: foreignNational.passportNumber,
            residenceCardNumber: foreignNational.residenceCardNumber,
          }}
          submitLabel="更新する"
        />
      ) : (
        <dl className="max-w-xl space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">国籍</dt>
            <dd>{foreignNational.nationality}</dd>
          </div>
        </dl>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">在留資格の履歴</h2>
        {canEdit && <ResidenceStatusForm action={createStatusAction} />}
        <ResidenceStatusTable
          clientId={clientId}
          foreignNationalId={foreignNationalId}
          residenceStatuses={foreignNational.residenceStatuses}
          canEdit={canEdit}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">入力内容のチェック</h2>
        <AnomalyList
          input={{
            birthDate: foreignNational.birthDate,
            passportNumber: foreignNational.passportNumber,
            residenceCardNumber: foreignNational.residenceCardNumber,
            residenceStatuses: foreignNational.residenceStatuses,
          }}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">添付書類</h2>
        {canEdit && (
          <UploadDocumentForm clientId={clientId} foreignNationalId={foreignNationalId} />
        )}
        <DocumentList
          clientId={clientId}
          foreignNationalId={foreignNationalId}
          documents={documents}
          canEdit={canEdit}
          canDownload={canDownload}
        />
      </div>

      {canEdit && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">AI補助（書類からの情報抽出）</h2>
            <p className="text-muted-foreground text-sm">
              アップロード済みの書類をAIで読み取り、氏名・在留カード番号・在留期限等を提案します。
              内容を確認したうえで取り込む項目を選択してください（自動保存はされません）。
            </p>
          </div>
          <AiAssistSection
            clientId={clientId}
            foreignNationalId={foreignNationalId}
            documents={documents}
          />
        </div>
      )}
    </div>
  );
}
