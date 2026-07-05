'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  getDocumentTypeLabel,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '@/features/documents/constants';
import { uploadDocumentSchema } from '@/features/documents/schema';
import { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/server/auth/guards';
import {
  createDocument,
  deleteDocument,
  findDocumentById,
} from '@/server/repositories/document-repository';
import { findForeignNationalById } from '@/server/repositories/foreign-national-repository';
import {
  buildStorageKey,
  deleteStoredFile,
  sanitizeFileNameComponent,
  saveFile,
} from '@/server/storage';

export interface ActionState {
  error?: string;
}

function fileExtension(fileName: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : 'bin';
}

export async function uploadDocumentAction(
  clientId: string,
  foreignNationalId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const parsed = uploadDocumentSchema.safeParse({ documentType: formData.get('documentType') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'ファイルを選択してください。' };
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return { error: 'ファイルサイズは10MB以下にしてください。' };
  }
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { error: 'PDF・JPEG・PNG形式のファイルのみアップロードできます。' };
  }

  const foreignNational = await findForeignNationalById(session.user.tenantId, foreignNationalId);
  if (!foreignNational) {
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  const typeLabel = getDocumentTypeLabel(parsed.data.documentType);
  const dateStr = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const ext = fileExtension(file.name);
  const storedFileName = `${sanitizeFileNameComponent(foreignNational.fullName)}_${sanitizeFileNameComponent(typeLabel)}_${dateStr}.${ext}`;
  const uniqueToken = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const storageKey = `${buildStorageKey(session.user.tenantId, foreignNationalId, uniqueToken)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await saveFile(storageKey, buffer);

  const document = await createDocument(session.user.tenantId, foreignNationalId, {
    documentType: parsed.data.documentType,
    originalFileName: file.name,
    storedFileName,
    storagePath: storageKey,
    mimeType: file.type,
    fileSize: file.size,
    uploadedByUserId: session.user.id,
  });
  if (!document) {
    await deleteStoredFile(storageKey);
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
  return {};
}

export async function deleteDocumentAction(formData: FormData): Promise<void> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);
  const clientId = formData.get('clientId');
  const foreignNationalId = formData.get('foreignNationalId');
  const documentId = formData.get('documentId');
  if (
    typeof clientId !== 'string' ||
    typeof foreignNationalId !== 'string' ||
    typeof documentId !== 'string'
  ) {
    return;
  }

  const document = await findDocumentById(session.user.tenantId, documentId);
  if (document) {
    await deleteDocument(session.user.tenantId, documentId);
    await deleteStoredFile(document.storagePath);
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
}
