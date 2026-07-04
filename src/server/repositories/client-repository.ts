import { Prisma } from '@/generated/prisma/client';
import { hashForLookup } from '@/server/db/encryption';
import { prisma } from '@/server/db/client';

/**
 * 顧客（法人）まわりのデータアクセス層。
 * 全ての関数は `tenantId` を必須引数に取り、必ずwhere句でテナントスコープを強制する。
 * (別テナントのデータへ誤ってアクセスしないための一元的な防御ライン)
 */

export interface ClientSearchFilters {
  companyName?: string;
  fullName?: string;
  residenceCardNumber?: string;
  assignedUserId?: string;
  expiresFrom?: Date;
  expiresTo?: Date;
}

const CLIENT_LIST_INCLUDE = {
  assignedUser: { select: { id: true, name: true } },
  foreignNationals: {
    include: {
      residenceStatuses: { orderBy: { expiresAt: 'desc' as const } },
    },
  },
} satisfies Prisma.ClientInclude;

export type ClientWithRelations = Prisma.ClientGetPayload<{ include: typeof CLIENT_LIST_INCLUDE }>;

function buildForeignNationalFilter(
  filters: ClientSearchFilters,
): Prisma.ForeignNationalWhereInput | undefined {
  const conditions: Prisma.ForeignNationalWhereInput = {};
  let hasCondition = false;

  if (filters.fullName) {
    conditions.fullName = { contains: filters.fullName, mode: 'insensitive' };
    hasCondition = true;
  }
  if (filters.residenceCardNumber) {
    // 暗号化(AES-GCM)は非決定的なため部分一致検索はできない。検索用ハッシュで完全一致のみ対応する。
    conditions.residenceCardNumberHash = hashForLookup(filters.residenceCardNumber);
    hasCondition = true;
  }
  if (filters.expiresFrom || filters.expiresTo) {
    conditions.residenceStatuses = {
      some: {
        expiresAt: {
          ...(filters.expiresFrom && { gte: filters.expiresFrom }),
          ...(filters.expiresTo && { lte: filters.expiresTo }),
        },
      },
    };
    hasCondition = true;
  }

  return hasCondition ? conditions : undefined;
}

export async function findClients(
  tenantId: string,
  filters: ClientSearchFilters = {},
): Promise<ClientWithRelations[]> {
  const foreignNationalFilter = buildForeignNationalFilter(filters);

  return prisma.client.findMany({
    where: {
      tenantId,
      ...(filters.companyName && {
        companyName: { contains: filters.companyName, mode: 'insensitive' },
      }),
      ...(filters.assignedUserId && { assignedUserId: filters.assignedUserId }),
      ...(foreignNationalFilter && { foreignNationals: { some: foreignNationalFilter } }),
    },
    include: CLIENT_LIST_INCLUDE,
    orderBy: { companyName: 'asc' },
  });
}

export async function findClientById(
  tenantId: string,
  clientId: string,
): Promise<ClientWithRelations | null> {
  return prisma.client.findFirst({
    where: { id: clientId, tenantId },
    include: CLIENT_LIST_INCLUDE,
  });
}

/** 法人名の完全一致でクライアントを検索する（Excel一括取込での紐付けに使用）。 */
export async function findClientByCompanyName(tenantId: string, companyName: string) {
  return prisma.client.findFirst({ where: { tenantId, companyName } });
}

export interface ClientInput {
  companyName: string;
  address?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  assignedUserId?: string | null;
  notes?: string | null;
}

export async function createClient(tenantId: string, data: ClientInput) {
  return prisma.client.create({ data: { ...data, tenantId } });
}

export async function updateClient(tenantId: string, clientId: string, data: ClientInput) {
  const { count } = await prisma.client.updateMany({
    where: { id: clientId, tenantId },
    data,
  });
  return count > 0;
}

export async function deleteClient(tenantId: string, clientId: string): Promise<boolean> {
  const { count } = await prisma.client.deleteMany({ where: { id: clientId, tenantId } });
  return count > 0;
}

/** 担当者選択用に、テナント内のユーザー一覧を取得する。 */
export async function listTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
