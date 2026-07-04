import type { Session } from 'next-auth';
import type { UserRole } from '@/generated/prisma/enums';
import { auth } from './index';

/**
 * 認可エラー。Server Action側で必ず投げる想定(Proxyの保護をすり抜けても
 * ここで弾かれるようにする、多層防御の方針。docs/05_security.md参照)。
 */
export class AuthzError extends Error {
  constructor(message = 'この操作を行う権限がありません') {
    super(message);
    this.name = 'AuthzError';
  }
}

/** ログイン済みであることを要求する。未ログインなら例外を投げる。 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthzError('ログインが必要です');
  }
  return session;
}

/** 指定したロールのいずれかであることを要求する。 */
export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new AuthzError();
  }
  return session;
}
