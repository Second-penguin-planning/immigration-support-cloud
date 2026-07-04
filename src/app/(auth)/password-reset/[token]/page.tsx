import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export default async function PasswordResetConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">新しいパスワードの設定</h1>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
