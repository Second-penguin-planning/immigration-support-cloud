'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { parseClientImportWorkbook, type ParsedImportRow } from '@/lib/excel-import';
import { requireRole } from '@/server/auth/guards';
import { createClient, findClientByCompanyName } from '@/server/repositories/client-repository';
import { createForeignNational } from '@/server/repositories/foreign-national-repository';
import { createResidenceStatus } from '@/server/repositories/residence-status-repository';
import { importRowSchema } from './schema';

export interface ParseState {
  rows: ParsedImportRow[];
  error?: string;
}

export interface CommitState {
  error?: string;
  success?: boolean;
  count?: number;
}

export async function parseImportAction(
  _prevState: ParseState,
  formData: FormData,
): Promise<ParseState> {
  await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { rows: [], error: 'ファイルを選択してください。' };
  }

  try {
    const buffer = await file.arrayBuffer();
    const rows = await parseClientImportWorkbook(buffer);
    if (rows.length === 0) {
      return {
        rows: [],
        error: '取り込めるデータが見つかりませんでした。見出し行の列名をご確認ください。',
      };
    }
    return { rows };
  } catch {
    return { rows: [], error: 'ファイルの解析に失敗しました。Excel形式(.xlsx)かご確認ください。' };
  }
}

export async function commitImportAction(
  _prevState: CommitState,
  formData: FormData,
): Promise<CommitState> {
  const session = await requireRole(UserRole.ADMIN, UserRole.STAFF);

  const rowsJson = formData.get('rows');
  if (typeof rowsJson !== 'string') {
    return { error: '取込データが見つかりません。もう一度アップロードしてください。' };
  }

  let rawRows: unknown[];
  try {
    const parsedJson: unknown = JSON.parse(rowsJson);
    if (!Array.isArray(parsedJson)) throw new Error('invalid rows payload');
    rawRows = parsedJson;
  } catch {
    return { error: '取込データの形式が不正です。もう一度アップロードしてください。' };
  }

  let count = 0;
  for (const rawRow of rawRows) {
    // クライアントから戻ってきたデータは信用せず、必ずサーバー側で再検証する。
    const parsed = importRowSchema.safeParse(rawRow);
    if (!parsed.success) continue;
    const row = parsed.data;

    let client = await findClientByCompanyName(session.user.tenantId, row.companyName);
    if (!client) {
      client = await createClient(session.user.tenantId, { companyName: row.companyName });
    }

    const foreignNational = await createForeignNational(session.user.tenantId, client.id, {
      fullName: row.fullName,
      fullNameKana: row.fullNameKana ?? null,
      nationality: row.nationality,
      birthDate: row.birthDate ?? null,
      passportNumber: row.passportNumber ?? null,
      residenceCardNumber: row.residenceCardNumber ?? null,
    });
    if (!foreignNational) continue;

    if (row.statusType && row.expiresAt) {
      await createResidenceStatus(session.user.tenantId, foreignNational.id, {
        statusType: row.statusType,
        expiresAt: row.expiresAt,
        permitNumber: null,
        grantedAt: null,
      });
    }

    count += 1;
  }

  revalidatePath('/clients');
  return { success: true, count };
}
