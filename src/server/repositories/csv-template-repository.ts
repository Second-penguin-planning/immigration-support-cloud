import type { Prisma } from '@/generated/prisma/client';
import type { CsvTemplateDefinition } from '@/features/csv-templates/constants';
import { prisma } from '@/server/db/client';

export async function findActiveCsvTemplate(tenantId: string) {
  return prisma.csvExportTemplate.findFirst({
    where: { tenantId, isActive: true },
    orderBy: { version: 'desc' },
  });
}

export async function listCsvTemplates(tenantId: string) {
  return prisma.csvExportTemplate.findMany({
    where: { tenantId },
    orderBy: { version: 'desc' },
  });
}

/**
 * テンプレートの新しいバージョンを作成し、既存のアクティブ版を無効化する。
 * 過去バージョンは削除せず残すため、過去分の再出力時に当時の定義を再現できる。
 */
export async function createCsvTemplateVersion(
  tenantId: string,
  name: string,
  definition: CsvTemplateDefinition,
) {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.csvExportTemplate.findFirst({
      where: { tenantId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    await tx.csvExportTemplate.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false },
    });

    return tx.csvExportTemplate.create({
      data: {
        tenantId,
        name,
        version: nextVersion,
        columnDefinition: definition as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  });
}
