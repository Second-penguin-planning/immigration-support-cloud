import { redirect } from 'next/navigation';
import { createClientAction } from '@/features/clients/actions';
import { ClientForm } from '@/features/clients/client-form';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { listTenantUsers } from '@/server/repositories/client-repository';

export default async function NewClientPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === UserRole.VIEWER) redirect('/clients');

  const users = await listTenantUsers(session.user.tenantId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">顧客の新規登録</h1>
      <ClientForm action={createClientAction} users={users} submitLabel="登録する" />
    </div>
  );
}
