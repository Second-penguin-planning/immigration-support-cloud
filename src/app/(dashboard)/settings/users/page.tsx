import { redirect } from 'next/navigation';
import { InviteUserForm } from '@/features/users/invite-user-form';
import { UserTable } from '@/features/users/user-table';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';

export default async function UsersSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== UserRole.ADMIN) redirect('/dashboard');

  const users = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ユーザー・権限管理</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          新しいユーザーの招待、権限（管理者・スタッフ・閲覧のみ）の変更ができます。
        </p>
      </div>
      <InviteUserForm />
      <UserTable users={users} currentUserId={session.user.id} />
    </div>
  );
}
