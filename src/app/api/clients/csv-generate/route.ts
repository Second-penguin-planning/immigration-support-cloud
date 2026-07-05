import iconv from 'iconv-lite';
import { NextResponse, type NextRequest } from 'next/server';
import type { CsvTemplateDefinition } from '@/features/csv-templates/constants';
import { buildCsvGenerationRows } from '@/features/csv-templates/build-rows';
import { clientSearchSchema } from '@/features/clients/schema';
import { UserRole } from '@/generated/prisma/enums';
import { toCsv, toCsvWithBom } from '@/lib/csv';
import { buildCsvColumns, validateTemplateRow } from '@/lib/csv-template';
import { auth } from '@/server/auth';
import { findClients } from '@/server/repositories/client-repository';
import { findActiveCsvTemplate } from '@/server/repositories/csv-template-repository';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
  }
  // 閲覧のみ(viewer)ロールはダウンロード不可(docs/01_requirements.md 1.1)
  if (session.user.role === UserRole.VIEWER) {
    return NextResponse.json({ message: 'この操作を行う権限がありません。' }, { status: 403 });
  }

  const template = await findActiveCsvTemplate(session.user.tenantId);
  if (!template) {
    return NextResponse.json({ message: 'CSVテンプレートが作成されていません。' }, { status: 400 });
  }
  const definition = template.columnDefinition as unknown as CsvTemplateDefinition;

  const params = request.nextUrl.searchParams;
  const parsed = clientSearchSchema.safeParse({
    companyName: params.get('companyName') ?? undefined,
    fullName: params.get('fullName') ?? undefined,
    residenceCardNumber: params.get('residenceCardNumber') ?? undefined,
    assignedUserId: params.get('assignedUserId') ?? undefined,
    expiresFrom: params.get('expiresFrom') ?? undefined,
    expiresTo: params.get('expiresTo') ?? undefined,
  });
  const filters = parsed.success ? parsed.data : {};

  const clients = await findClients(session.user.tenantId, filters);
  const rows = buildCsvGenerationRows(clients);

  if (rows.length === 0) {
    return NextResponse.json({ message: '対象となる外国人情報がありません。' }, { status: 400 });
  }

  // クライアントの検証をそのまま信用せず、生成前にサーバー側で必ず再検証する。
  const hasMissingField = rows.some(
    (row) => validateTemplateRow(definition, row.source).missingFieldLabels.length > 0,
  );
  if (hasMissingField) {
    return NextResponse.json(
      { message: '必須項目が未入力の行があるため生成できません。' },
      { status: 400 },
    );
  }

  const columns = buildCsvColumns(definition);
  const sources = rows.map((row) => row.source);
  const fileName = `immigration_submission_${Date.now()}.csv`;

  if (definition.encoding === 'shift_jis') {
    const csvText = toCsv(sources, columns);
    const encoded = iconv.encode(csvText, 'Shift_JIS');
    return new NextResponse(new Uint8Array(encoded), {
      headers: {
        'Content-Type': 'text/csv; charset=Shift_JIS',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  }

  const csvText = toCsvWithBom(sources, columns);
  return new NextResponse(csvText, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
