import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAlreadySignedIn } from '@/features/auth/actions';
import { LoginForm } from '@/features/auth/login-form';

export default async function LoginPage() {
  if (await isAlreadySignedIn()) redirect('/dashboard');

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Immigration Support Cloud</h1>
        <p className="text-muted-foreground mt-1 text-sm">ログイン</p>
      </div>
      <LoginForm />
      <p className="text-muted-foreground text-center text-sm">
        <Link href="/password-reset" className="underline">
          パスワードをお忘れですか？
        </Link>
      </p>
    </div>
  );
}
