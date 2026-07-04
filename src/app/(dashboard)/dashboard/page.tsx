import { auth } from '@/server/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-xl font-semibold">ダッシュボード</h1>
      <p className="text-muted-foreground mt-2">
        ようこそ、{session?.user.name}さん。期限管理・通知は今後のPhaseで実装予定です。
      </p>
    </div>
  );
}
