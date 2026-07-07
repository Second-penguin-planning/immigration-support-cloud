import { prisma } from '@/server/db/client';
import { CoeApplicationStatus } from '@/generated/prisma/enums';
import type { CoeApplication } from '@/generated/prisma/client';

/**
 * 在留資格認定証明書交付申請のデータアクセス層。
 * `foreignNational.client.tenantId` 経由でテナントスコープを強制する。
 */

export interface CoeApplicationInput {
  statusType: string;
  plannedSubmissionDate?: Date | null;
  submittedAt?: Date | null;
  resultNotifiedAt?: Date | null;
  notes?: string | null;
}

export interface ConvertToResidenceStatusInput {
  residenceCardNumber: string;
  grantedAt?: Date | null;
  expiresAt: Date;
}

export async function listCoeApplications(
  tenantId: string,
  foreignNationalId: string,
): Promise<CoeApplication[]> {
  return prisma.coeApplication.findMany({
    where: { foreignNationalId, foreignNational: { client: { tenantId } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCoeApplication(
  tenantId: string,
  foreignNationalId: string,
  createdByUserId: string,
  data: CoeApplicationInput,
): Promise<boolean> {
  const foreignNational = await prisma.foreignNational.findFirst({
    where: { id: foreignNationalId, client: { tenantId } },
  });
  if (!foreignNational) return false;

  await prisma.coeApplication.create({
    data: { ...data, foreignNationalId, createdByUserId },
  });
  return true;
}

export async function updateCoeApplicationStatus(
  tenantId: string,
  coeApplicationId: string,
  status: CoeApplicationStatus,
): Promise<boolean> {
  const { count } = await prisma.coeApplication.updateMany({
    where: { id: coeApplicationId, foreignNational: { client: { tenantId } } },
    data: { status },
  });
  return count > 0;
}

export async function deleteCoeApplication(
  tenantId: string,
  coeApplicationId: string,
): Promise<boolean> {
  const { count } = await prisma.coeApplication.deleteMany({
    where: { id: coeApplicationId, foreignNational: { client: { tenantId } } },
  });
  return count > 0;
}

/**
 * 交付申請を「交付」に確定し、実際の在留資格レコードへ変換する。
 * 併せて外国人情報の在留カード番号を更新する（未入力の場合のみ）。
 */
export async function approveAndConvertCoeApplication(
  tenantId: string,
  coeApplicationId: string,
  data: ConvertToResidenceStatusInput,
): Promise<boolean> {
  const application = await prisma.coeApplication.findFirst({
    where: { id: coeApplicationId, foreignNational: { client: { tenantId } } },
  });
  if (!application || application.convertedResidenceStatusId) return false;

  await prisma.$transaction(async (tx) => {
    const residenceStatus = await tx.residenceStatus.create({
      data: {
        foreignNationalId: application.foreignNationalId,
        statusType: application.statusType,
        grantedAt: data.grantedAt ?? null,
        expiresAt: data.expiresAt,
      },
    });
    await tx.foreignNational.update({
      where: { id: application.foreignNationalId },
      data: { residenceCardNumber: data.residenceCardNumber },
    });
    await tx.coeApplication.update({
      where: { id: coeApplicationId },
      data: {
        status: CoeApplicationStatus.APPROVED,
        convertedResidenceStatusId: residenceStatus.id,
      },
    });
  });
  return true;
}
