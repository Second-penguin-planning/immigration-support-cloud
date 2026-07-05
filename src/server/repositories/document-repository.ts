import { prisma } from '@/server/db/client';

/**
 * 添付書類のデータアクセス層。
 * DocumentはtenantIdを持たないため、`foreignNational.client.tenantId`経由で
 * テナントスコープを強制する。
 */

export async function listDocuments(tenantId: string, foreignNationalId: string) {
  return prisma.document.findMany({
    where: { foreignNationalId, foreignNational: { client: { tenantId } } },
    orderBy: { createdAt: 'desc' },
  });
}

export interface DocumentInput {
  documentType: string;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId?: string | null;
}

export async function createDocument(
  tenantId: string,
  foreignNationalId: string,
  data: DocumentInput,
) {
  const foreignNational = await prisma.foreignNational.findFirst({
    where: { id: foreignNationalId, client: { tenantId } },
  });
  if (!foreignNational) return null;

  return prisma.document.create({ data: { ...data, foreignNationalId } });
}

export async function findDocumentById(tenantId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, foreignNational: { client: { tenantId } } },
  });
}

export async function deleteDocument(tenantId: string, documentId: string): Promise<boolean> {
  const { count } = await prisma.document.deleteMany({
    where: { id: documentId, foreignNational: { client: { tenantId } } },
  });
  return count > 0;
}
