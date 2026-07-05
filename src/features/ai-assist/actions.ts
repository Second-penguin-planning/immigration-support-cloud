'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { logger } from '@/lib/logger';
import { isAiConfigured } from '@/server/ai/client';
import { extractDocumentFields } from '@/server/ai/extract-document';
import { requireRole } from '@/server/auth/guards';
import { findDocumentById } from '@/server/repositories/document-repository';
import {
  findForeignNationalById,
  updateForeignNational,
} from '@/server/repositories/foreign-national-repository';
import { createResidenceStatus } from '@/server/repositories/residence-status-repository';
import { readStoredFile } from '@/server/storage/local-storage';
import type { ExtractedFields } from './schema';

export interface ExtractState {
  error?: string;
  extracted?: ExtractedFields;
}

export async function extractDocumentAction(
  documentId: string,
  _prevState: ExtractState,
  _formData: FormData,
): Promise<ExtractState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  if (!isAiConfigured()) {
    return {
      error:
        'AI補助機能を使うには管理者が ANTHROPIC_API_KEY を設定する必要があります（.env.local）。',
    };
  }

  const document = await findDocumentById(session.user.tenantId, documentId);
  if (!document) {
    return { error: '対象の書類が見つかりませんでした。' };
  }

  try {
    const buffer = await readStoredFile(document.storagePath);
    const extracted = await extractDocumentFields(buffer, document.mimeType);
    return { extracted };
  } catch (error) {
    logger.error('AI書類抽出に失敗しました', {
      documentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: 'AIによる情報抽出に失敗しました。しばらくしてから再度お試しください。' };
  }
}

export interface ApplyState {
  error?: string;
  success?: boolean;
}

/** ユーザーが選択した抽出項目のみを、既存の外国人情報・在留資格に取り込む。 */
export async function applyExtractedFieldsAction(
  clientId: string,
  foreignNationalId: string,
  _prevState: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const current = await findForeignNationalById(session.user.tenantId, foreignNationalId);
  if (!current) {
    return { error: '対象の外国人情報が見つかりませんでした。' };
  }

  const stringField = (key: string): string | undefined => {
    const value = formData.get(key);
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  const fullName = stringField('fullName');
  const fullNameKana = stringField('fullNameKana');
  const nationality = stringField('nationality');
  const birthDateStr = stringField('birthDate');
  const passportNumber = stringField('passportNumber');
  const residenceCardNumber = stringField('residenceCardNumber');
  const statusType = stringField('statusType');
  const expiresAtStr = stringField('expiresAt');

  const hasForeignNationalUpdate = Boolean(
    fullName ??
    fullNameKana ??
    nationality ??
    birthDateStr ??
    passportNumber ??
    residenceCardNumber,
  );

  if (hasForeignNationalUpdate) {
    await updateForeignNational(session.user.tenantId, foreignNationalId, {
      fullName: fullName ?? current.fullName,
      fullNameKana: fullNameKana ?? current.fullNameKana,
      nationality: nationality ?? current.nationality,
      birthDate: birthDateStr ? new Date(birthDateStr) : current.birthDate,
      passportNumber: passportNumber ?? current.passportNumber,
      residenceCardNumber: residenceCardNumber ?? current.residenceCardNumber,
    });
  }

  if (statusType && expiresAtStr) {
    await createResidenceStatus(session.user.tenantId, foreignNationalId, {
      statusType,
      expiresAt: new Date(expiresAtStr),
      permitNumber: null,
      grantedAt: null,
    });
  }

  revalidatePath(`/clients/${clientId}/foreign-nationals/${foreignNationalId}`);
  return { success: true };
}
