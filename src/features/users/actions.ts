'use server';

import { revalidatePath } from 'next/cache';
import { setPasswordSchema } from '@/features/auth/schema';
import { hash } from 'bcryptjs';
import { UserRole, VerificationTokenType } from '@/generated/prisma/enums';
import { sendMail } from '@/server/email/mailer';
import { requireRole } from '@/server/auth/guards';
import { consumeVerificationToken, issueVerificationToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/client';
import type { ActionState } from '@/features/auth/actions';
import { inviteUserSchema, toggleUserActiveSchema, updateUserRoleSchema } from './schema';

function appBaseUrl(): string {
  return process.env.APP_BASE_URL ?? 'http://localhost:3000';
}

export async function inviteUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN);

  const parsed = inviteUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: 'このメールアドレスはすでに登録されています。' };
  }

  const user = await prisma.user.create({
    data: {
      tenantId: session.user.tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
    },
  });

  const rawToken = await issueVerificationToken(
    user.email,
    VerificationTokenType.EMAIL_VERIFICATION,
  );
  const inviteUrl = `${appBaseUrl()}/invite/${rawToken}`;

  await sendMail({
    to: user.email,
    subject: '【Immigration Support Cloud】アカウント招待のご案内',
    text: `Immigration Support Cloudへ招待されました。以下のリンクから24時間以内にパスワードを設定してください。\n${inviteUrl}`,
    html: `<p>Immigration Support Cloudへ招待されました。以下のリンクから24時間以内にパスワードを設定してください。</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
  });

  revalidatePath('/settings/users');
  return { success: true };
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  await requireRole(UserRole.ADMIN);

  const parsed = updateUserRoleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
  });
  if (!parsed.success) return;

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  revalidatePath('/settings/users');
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  await requireRole(UserRole.ADMIN);

  const parsed = toggleUserActiveSchema.safeParse({
    userId: formData.get('userId'),
    isActive: formData.get('isActive'),
  });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { isActive: parsed.data.isActive },
  });
  revalidatePath('/settings/users');
}

export async function acceptInviteAction(
  token: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' };
  }

  const email = await consumeVerificationToken(token, VerificationTokenType.EMAIL_VERIFICATION);
  if (!email) {
    return { error: 'リンクが無効か期限切れです。管理者に再招待を依頼してください。' };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, emailVerified: new Date() },
  });

  return { success: true };
}
