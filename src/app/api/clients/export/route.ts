import { NextResponse, type NextRequest } from 'next/server';
import { clientSearchSchema } from '@/features/clients/schema';
import { UserRole } from '@/generated/prisma/enums';
import { toCsvWithBom } from '@/lib/csv';
import { auth } from '@/server/auth';
import { findClients } from '@/server/repositories/client-repository';

interface ExportRow {
  companyName: string;
  assignedUserName: string;
  fullName: string;
  nationality: string;
  statusType: string;
  expiresAt: Date | null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
  }
  // 閲覧のみ(viewer)ロールはダウンロード不可(docs/01_requirements.md 1.1)
  if (session.user.role === UserRole.VIEWER) {
    return NextResponse.json({ message: 'この操作を行う権限がありません。' }, { status: 403 });
  }

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

  const rows: ExportRow[] = clients.flatMap((client) => {
    const assignedUserName = client.assignedUser?.name ?? '';
    if (client.foreignNationals.length === 0) {
      const emptyRow: ExportRow = {
        companyName: client.companyName,
        assignedUserName,
        fullName: '',
        nationality: '',
        statusType: '',
        expiresAt: null,
      };
      return [emptyRow];
    }
    return client.foreignNationals.map((foreignNational) => ({
      companyName: client.companyName,
      assignedUserName,
      fullName: foreignNational.fullName,
      nationality: foreignNational.nationality,
      statusType: foreignNational.residenceStatuses[0]?.statusType ?? '',
      expiresAt: foreignNational.residenceStatuses[0]?.expiresAt ?? null,
    }));
  });

  const csv = toCsvWithBom<ExportRow>(rows, [
    { header: '法人名', value: (row) => row.companyName },
    { header: '担当者', value: (row) => row.assignedUserName },
    { header: '外国人氏名', value: (row) => row.fullName },
    { header: '国籍', value: (row) => row.nationality },
    { header: '在留資格', value: (row) => row.statusType },
    { header: '在留期限', value: (row) => row.expiresAt?.toLocaleDateString('ja-JP') ?? '' },
  ]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clients_${Date.now()}.csv"`,
    },
  });
}
