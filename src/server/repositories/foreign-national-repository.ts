import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/server/db/client';

/**
 * 外国人情報のデータアクセス層。
 * ForeignNational自体はtenantIdを持たないため、`client.tenantId`経由で
 * テナントスコープを強制する（別テナントのClientに紐づくレコードは操作できない）。
 */

const FOREIGN_NATIONAL_INCLUDE = {
  residenceStatuses: { orderBy: { expiresAt: 'desc' as const } },
  client: { select: { id: true, companyName: true, tenantId: true } },
} satisfies Prisma.ForeignNationalInclude;

export type ForeignNationalWithRelations = Prisma.ForeignNationalGetPayload<{
  include: typeof FOREIGN_NATIONAL_INCLUDE;
}>;

export async function findForeignNationalById(
  tenantId: string,
  foreignNationalId: string,
): Promise<ForeignNationalWithRelations | null> {
  return prisma.foreignNational.findFirst({
    where: { id: foreignNationalId, client: { tenantId } },
    include: FOREIGN_NATIONAL_INCLUDE,
  });
}

export interface ForeignNationalInput {
  fullName: string;
  fullNameKana?: string | null;
  nationality: string;
  birthDate?: Date | null;
  passportNumber?: string | null;
  residenceCardNumber?: string | null;
}

/** 指定したクライアントがテナント内に存在することを確認したうえで作成する。 */
export async function createForeignNational(
  tenantId: string,
  clientId: string,
  data: ForeignNationalInput,
): Promise<ForeignNationalWithRelations | null> {
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
  if (!client) return null;

  const created = await prisma.foreignNational.create({ data: { ...data, clientId } });
  return findForeignNationalById(tenantId, created.id);
}

export async function updateForeignNational(
  tenantId: string,
  foreignNationalId: string,
  data: ForeignNationalInput,
): Promise<boolean> {
  const { count } = await prisma.foreignNational.updateMany({
    where: { id: foreignNationalId, client: { tenantId } },
    data,
  });
  return count > 0;
}

export async function deleteForeignNational(
  tenantId: string,
  foreignNationalId: string,
): Promise<boolean> {
  const { count } = await prisma.foreignNational.deleteMany({
    where: { id: foreignNationalId, client: { tenantId } },
  });
  return count > 0;
}
