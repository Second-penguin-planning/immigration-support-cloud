import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/server/db/client';
import type { VerificationTokenType } from '@/generated/prisma/enums';

const EXPIRY_MS: Record<VerificationTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24時間
  PASSWORD_RESET: 60 * 60 * 1000, // 1時間
};

/** URLに含めても安全な高エントロピーの生トークンを生成する。 */
export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * 生トークンをDB保存用に一方向ハッシュ化する(SHA-256)。
 * 生トークン自体が32byteの高エントロピーな乱数のため、暗号化フィールドのような
 * 用途別鍵導出(HKDF)は不要で、単純なハッシュで十分。
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('base64url');
}

/** メール認証・パスワードリセット用トークンを発行し、生トークンを返す(メール本文に埋め込む用)。 */
export async function issueVerificationToken(
  identifier: string,
  type: VerificationTokenType,
): Promise<string> {
  const rawToken = generateRawToken();
  await prisma.verificationToken.create({
    data: {
      identifier,
      tokenHash: hashToken(rawToken),
      type,
      expiresAt: new Date(Date.now() + EXPIRY_MS[type]),
    },
  });
  return rawToken;
}

/**
 * 生トークンを検証し、有効であれば使用済みにマークして対象メールアドレスを返す。
 * 無効(存在しない/期限切れ/使用済み)な場合は null を返す。
 */
export async function consumeVerificationToken(
  rawToken: string,
  type: VerificationTokenType,
): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) {
    return null;
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return token.identifier;
}
