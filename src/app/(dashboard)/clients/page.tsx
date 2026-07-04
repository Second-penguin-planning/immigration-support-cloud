import { redirect } from 'next/navigation';
import { LinkButton } from '@/components/ui/button';
import { ClientSearchForm } from '@/features/clients/client-search-form';
import { ClientTable } from '@/features/clients/client-table';
import { clientSearchSchema } from '@/features/clients/schema';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findClients, listTenantUsers } from '@/server/repositories/client-repository';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const rawParams = await searchParams;
  const singleValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const rawFilters = {
    companyName: singleValue(rawParams.companyName),
    fullName: singleValue(rawParams.fullName),
    residenceCardNumber: singleValue(rawParams.residenceCardNumber),
    assignedUserId: singleValue(rawParams.assignedUserId),
    expiresFrom: singleValue(rawParams.expiresFrom),
    expiresTo: singleValue(rawParams.expiresTo),
  };
  const parsed = clientSearchSchema.safeParse(rawFilters);
  const filters = parsed.success ? parsed.data : {};

  const [clients, users] = await Promise.all([
    findClients(session.user.tenantId, filters),
    listTenantUsers(session.user.tenantId),
  ]);

  // 閲覧のみ(viewer)ロールは作成・ダウンロード・取込を行えない(docs/01_requirements.md 1.1)
  const canEdit = session.user.role !== UserRole.VIEWER;
  const exportQuery = new URLSearchParams(
    Object.entries(rawFilters).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">顧客一覧・検索</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            法人・外国人・在留資格・担当者で検索できます。
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <a
              href={`/api/clients/export${exportQuery ? `?${exportQuery}` : ''}`}
              className="border-border hover:bg-muted inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              CSVダウンロード
            </a>
          )}
          {canEdit && (
            <LinkButton href="/clients/import" variant="secondary">
              Excel一括取込
            </LinkButton>
          )}
          {canEdit && <LinkButton href="/clients/new">新規登録</LinkButton>}
        </div>
      </div>
      <ClientSearchForm users={users} defaultValues={rawFilters} />
      <ClientTable clients={clients} />
    </div>
  );
}
