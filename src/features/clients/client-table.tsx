import Link from 'next/link';
import type { ClientWithRelations } from '@/server/repositories/client-repository';

export function ClientTable({ clients }: { clients: ClientWithRelations[] }) {
  if (clients.length === 0) {
    return <p className="text-muted-foreground text-sm">該当する顧客が見つかりませんでした。</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-border text-muted-foreground border-b">
          <th className="py-2 pr-4 font-medium">法人名</th>
          <th className="py-2 pr-4 font-medium">担当者</th>
          <th className="py-2 pr-4 font-medium">外国人</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id} className="border-border border-b align-top">
            <td className="py-2 pr-4">
              <Link href={`/clients/${client.id}`} className="font-medium underline">
                {client.companyName}
              </Link>
              {client.address && <p className="text-muted-foreground">{client.address}</p>}
            </td>
            <td className="py-2 pr-4">{client.assignedUser?.name ?? '-'}</td>
            <td className="py-2 pr-4">
              {client.foreignNationals.length === 0 ? (
                <span className="text-muted-foreground">なし</span>
              ) : (
                <ul className="space-y-1">
                  {client.foreignNationals.map((fn) => (
                    <li key={fn.id}>
                      <Link
                        href={`/clients/${client.id}/foreign-nationals/${fn.id}`}
                        className="underline"
                      >
                        {fn.fullName}
                      </Link>
                      {fn.residenceStatuses[0] && (
                        <span className="text-muted-foreground">
                          {' '}
                          （{fn.residenceStatuses[0].statusType} / 期限:{' '}
                          {fn.residenceStatuses[0].expiresAt.toLocaleDateString('ja-JP')}）
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
