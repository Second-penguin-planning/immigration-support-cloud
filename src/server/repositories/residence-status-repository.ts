import { prisma } from '@/server/db/client';

/**
 * 在留資格履歴のデータアクセス層。
 * `foreignNational.client.tenantId` 経由でテナントスコープを強制する。
 */

export interface ResidenceStatusInput {
  statusType: string;
  permitNumber?: string | null;
  grantedAt?: Date | null;
  expiresAt: Date;
}

/** 指定した外国人がテナント内に存在することを確認したうえで作成する。 */
export async function createResidenceStatus(
  tenantId: string,
  foreignNationalId: string,
  data: ResidenceStatusInput,
): Promise<boolean> {
  const foreignNational = await prisma.foreignNational.findFirst({
    where: { id: foreignNationalId, client: { tenantId } },
  });
  if (!foreignNational) return false;

  await prisma.residenceStatus.create({ data: { ...data, foreignNationalId } });
  return true;
}

export async function updateResidenceStatus(
  tenantId: string,
  residenceStatusId: string,
  data: ResidenceStatusInput,
): Promise<boolean> {
  const { count } = await prisma.residenceStatus.updateMany({
    where: { id: residenceStatusId, foreignNational: { client: { tenantId } } },
    data,
  });
  return count > 0;
}

export async function deleteResidenceStatus(
  tenantId: string,
  residenceStatusId: string,
): Promise<boolean> {
  const { count } = await prisma.residenceStatus.deleteMany({
    where: { id: residenceStatusId, foreignNational: { client: { tenantId } } },
  });
  return count > 0;
}
