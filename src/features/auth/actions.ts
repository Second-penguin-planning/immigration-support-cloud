'use server';

import { hash } from 'bcryptjs';
import { AuthError } from 'next-auth';
import { loginSchema, requestPasswordResetSchema, setPasswordSchema } from '@/features/auth/schema';
import { VerificationTokenType } from '@/generated/prisma/enums';
import { logger } from '@/lib/logger';
import { sendMail } from '@/server/email/mailer';
import { auth, signIn, signOut } from '@/server/auth';
import { consumeVerificationToken, issueVerificationToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/client';

export interface ActionState {
  error?: string;
  success?: boolean;
}

function firstIssueMessage(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

function appBaseUrl(): string {
  return process.env.APP_BASE_URL ?? 'http://localhost:3000';
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: 'メールアドレスまたはパスワードが正しくないか、メール認証が完了していません。',
      };
    }
    throw error; // リダイレクト(NEXT_REDIRECT)等はそのまま再スローする
  }
}

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // ユーザーの有無に関わらず同じ成功表示にする(メールアドレス列挙対策)
  if (user && user.isActive) {
    const rawToken = await issueVerificationToken(user.email, VerificationTokenType.PASSWORD_RESET);
    const resetUrl = `${appBaseUrl()}/password-reset/${rawToken}`;
    await sendMail({
      to: user.email,
      subject: '【Immigration Support Cloud】パスワード再設定のご案内',
      text: `以下のリンクから1時間以内にパスワードを再設定してください。\n${resetUrl}`,
      html: `<p>以下のリンクから1時間以内にパスワードを再設定してください。</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } else {
    logger.info('パスワードリセット要求(該当ユーザーなし、または無効化済み)', {
      email: parsed.data.email,
    });
  }

  return { success: true };
}

export async function resetPasswordAction(
  token: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const email = await consumeVerificationToken(token, VerificationTokenType.PASSWORD_RESET);
  if (!email) {
    return {
      error: 'リンクが無効か期限切れです。もう一度パスワードリセットの申請をお試しください。',
    };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  return { success: true };
}

/** ログイン中のユーザーがいれば true。招待/ログインページからダッシュボードへ誘導する判定に使う。 */
export async function isAlreadySignedIn(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
