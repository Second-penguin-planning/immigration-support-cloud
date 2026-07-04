import { AcceptInviteForm } from '@/features/users/accept-invite-form';

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">アカウント招待</h1>
        <p className="text-muted-foreground mt-1 text-sm">パスワードを設定してください。</p>
      </div>
      <AcceptInviteForm token={token} />
    </div>
  );
}
