import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/features/auth/actions';
import { ROLE_LABEL } from '@/features/users/constants';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <Link href="/dashboard" className="font-semibold">
          Immigration Support Cloud
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {session.user.name}（{ROLE_LABEL[session.user.role]}）
          </span>
          <Link href="/clients" className="underline">
            顧客管理
          </Link>
          {session.user.role === UserRole.ADMIN && (
            <Link href="/settings/users" className="underline">
              ユーザー管理
            </Link>
          )}
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              ログアウト
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
