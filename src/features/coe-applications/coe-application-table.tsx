import { Button } from '@/components/ui/button';
import { CoeApplicationStatus } from '@/generated/prisma/enums';
import type { CoeApplication } from '@/generated/prisma/client';
import {
  approveAndConvertCoeApplicationAction,
  deleteCoeApplicationAction,
  markCoeApplicationRejectedAction,
  markCoeApplicationSubmittedAction,
  markCoeApplicationWithdrawnAction,
} from './actions';
import { ApproveCoeApplicationForm } from './approve-coe-application-form';

const STATUS_LABELS: Record<CoeApplicationStatus, string> = {
  DRAFT: '準備中',
  SUBMITTED: '提出済み',
  APPROVED: '交付',
  REJECTED: '不交付',
  WITHDRAWN: '取下げ',
};

interface CoeApplicationTableProps {
  clientId: string;
  foreignNationalId: string;
  applications: CoeApplication[];
  canEdit: boolean;
}

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString('ja-JP') : '-';
}

export function CoeApplicationTable({
  clientId,
  foreignNationalId,
  applications,
  canEdit,
}: CoeApplicationTableProps) {
  if (applications.length === 0) {
    return <p className="text-muted-foreground text-sm">交付申請はまだありません。</p>;
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <div key={application.id} className="border-border space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium">{application.statusType}</span>
              <span className="text-muted-foreground">
                ステータス: {STATUS_LABELS[application.status]}
              </span>
              <span className="text-muted-foreground">
                申請予定日: {formatDate(application.plannedSubmissionDate)}
              </span>
              <span className="text-muted-foreground">
                提出日: {formatDate(application.submittedAt)}
              </span>
              <span className="text-muted-foreground">
                結果通知日: {formatDate(application.resultNotifiedAt)}
              </span>
            </div>
            {canEdit && application.status !== CoeApplicationStatus.APPROVED && (
              <form action={deleteCoeApplicationAction}>
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="foreignNationalId" value={foreignNationalId} />
                <input type="hidden" name="coeApplicationId" value={application.id} />
                <Button type="submit" variant="danger" className="h-8 px-2 text-xs">
                  削除
                </Button>
              </form>
            )}
          </div>
          {application.notes && (
            <p className="text-muted-foreground text-xs">備考: {application.notes}</p>
          )}

          {canEdit && application.status === CoeApplicationStatus.DRAFT && (
            <div className="flex flex-wrap gap-2">
              <form
                action={markCoeApplicationSubmittedAction.bind(null, clientId, foreignNationalId)}
              >
                <input type="hidden" name="coeApplicationId" value={application.id} />
                <Button type="submit" variant="secondary" className="h-8 px-3 text-xs">
                  提出済みにする
                </Button>
              </form>
              <form
                action={markCoeApplicationWithdrawnAction.bind(null, clientId, foreignNationalId)}
              >
                <input type="hidden" name="coeApplicationId" value={application.id} />
                <Button type="submit" variant="secondary" className="h-8 px-3 text-xs">
                  取り下げる
                </Button>
              </form>
            </div>
          )}

          {canEdit && application.status === CoeApplicationStatus.SUBMITTED && (
            <div className="space-y-2">
              <ApproveCoeApplicationForm
                action={approveAndConvertCoeApplicationAction.bind(
                  null,
                  clientId,
                  foreignNationalId,
                  application.id,
                )}
              />
              <form
                action={markCoeApplicationRejectedAction.bind(null, clientId, foreignNationalId)}
              >
                <input type="hidden" name="coeApplicationId" value={application.id} />
                <Button type="submit" variant="secondary" className="h-8 px-3 text-xs">
                  不交付にする
                </Button>
              </form>
            </div>
          )}

          {application.status === CoeApplicationStatus.APPROVED && (
            <p className="text-primary text-xs">在留資格の履歴に反映済みです。</p>
          )}
        </div>
      ))}
    </div>
  );
}
