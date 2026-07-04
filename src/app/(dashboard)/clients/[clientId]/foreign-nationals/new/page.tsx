import { notFound, redirect } from 'next/navigation';
import { createForeignNationalAction } from '@/features/clients/foreign-national-actions';
import { ForeignNationalForm } from '@/features/clients/foreign-national-form';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findClientById } from '@/server/repositories/client-repository';

export default async function NewForeignNationalPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === UserRole.VIEWER) redirect(`/clients/${clientId}`);

  const client = await findClientById(session.user.tenantId, clientId);
  if (!client) notFound();

  const action = createForeignNationalAction.bind(null, clientId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{client.companyName} - 外国人の追加</h1>
      <ForeignNationalForm action={action} submitLabel="追加する" />
    </div>
  );
}
