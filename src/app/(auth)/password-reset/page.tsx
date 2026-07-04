import Link from 'next/link';
import { RequestPasswordResetForm } from '@/features/auth/request-password-reset-form';

export default function PasswordResetRequestPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">パスワードリセット</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          登録済みのメールアドレスを入力してください。
        </p>
      </div>
      <RequestPasswordResetForm />
      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="underline">
          ログインページに戻る
        </Link>
      </p>
    </div>
  );
}
