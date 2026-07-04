import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button, LinkButton } from '@/components/ui/button';
import { deleteClientAction, updateClientAction } from '@/features/clients/actions';
import { ClientForm } from '@/features/clients/client-form';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findClientById, listTenantUsers } from '@/server/repositories/client-repository';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const client = await findClientById(session.user.tenantId, clientId);
  if (!client) notFound();

  const canEdit = session.user.role !== UserRole.VIEWER;
  const users = canEdit ? await listTenantUsers(session.user.tenantId) : [];
  const updateAction = updateClientAction.bind(null, clientId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{client.companyName}</h1>
        {canEdit && (
          <form action={deleteClientAction}>
            <input type="hidden" name="clientId" value={client.id} />
            <Button type="submit" variant="danger">
              顧客を削除
            </Button>
          </form>
        )}
      </div>

      {canEdit ? (
        <ClientForm
          action={updateAction}
          users={users}
          defaultValues={{
            companyName: client.companyName,
            address: client.address,
            contactName: client.contactName,
            contactEmail: client.contactEmail,
            contactPhone: client.contactPhone,
            assignedUserId: client.assignedUserId,
            notes: client.notes,
          }}
          submitLabel="更新する"
        />
      ) : (
        <dl className="max-w-xl space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">所在地</dt>
            <dd>{client.address ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">担当者</dt>
            <dd>{client.assignedUser?.name ?? '-'}</dd>
          </div>
        </dl>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">外国人情報</h2>
          {canEdit && (
            <LinkButton href={`/clients/${client.id}/foreign-nationals/new`}>
              外国人を追加
            </LinkButton>
          )}
        </div>
        {client.foreignNationals.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">登録されている外国人はいません。</p>
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {client.foreignNationals.map((foreignNational) => (
              <li key={foreignNational.id} className="py-3">
                <Link
                  href={`/clients/${client.id}/foreign-nationals/${foreignNational.id}`}
                  className="font-medium underline"
                >
                  {foreignNational.fullName}
                </Link>
                <p className="text-muted-foreground text-sm">{foreignNational.nationality}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
