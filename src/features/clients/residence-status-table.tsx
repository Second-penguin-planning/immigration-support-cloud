import { Button } from '@/components/ui/button';
import type { ResidenceStatus } from '@/generated/prisma/client';
import { deleteResidenceStatusAction } from './residence-status-actions';

interface ResidenceStatusTableProps {
  clientId: string;
  foreignNationalId: string;
  residenceStatuses: ResidenceStatus[];
  canEdit: boolean;
}

export function ResidenceStatusTable({
  clientId,
  foreignNationalId,
  residenceStatuses,
  canEdit,
}: ResidenceStatusTableProps) {
  if (residenceStatuses.length === 0) {
    return <p className="text-muted-foreground text-sm">在留資格の履歴はまだありません。</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-border text-muted-foreground border-b">
          <th className="py-2 pr-4 font-medium">在留資格</th>
          <th className="py-2 pr-4 font-medium">許可番号</th>
          <th className="py-2 pr-4 font-medium">許可年月日</th>
          <th className="py-2 pr-4 font-medium">在留期限</th>
          {canEdit && <th className="py-2 pr-4 font-medium">操作</th>}
        </tr>
      </thead>
      <tbody>
        {residenceStatuses.map((status) => (
          <tr key={status.id} className="border-border border-b">
            <td className="py-2 pr-4">{status.statusType}</td>
            <td className="py-2 pr-4">{status.permitNumber ?? '-'}</td>
            <td className="py-2 pr-4">
              {status.grantedAt ? status.grantedAt.toLocaleDateString('ja-JP') : '-'}
            </td>
            <td className="py-2 pr-4">{status.expiresAt.toLocaleDateString('ja-JP')}</td>
            {canEdit && (
              <td className="py-2 pr-4">
                <form action={deleteResidenceStatusAction}>
                  <input type="hidden" name="clientId" value={clientId} />
                  <input type="hidden" name="foreignNationalId" value={foreignNationalId} />
                  <input type="hidden" name="residenceStatusId" value={status.id} />
                  <Button type="submit" variant="danger" className="h-8 px-2 text-xs">
                    削除
                  </Button>
                </form>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
