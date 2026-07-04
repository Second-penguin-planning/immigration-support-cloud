import { redirect } from 'next/navigation';
import { ExcelImportForm } from '@/features/clients/excel-import-form';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';

export default async function ClientImportPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === UserRole.VIEWER) redirect('/clients');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Excel一括取込</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          1行目を見出しとして、以下の列名を含むExcelファイル（.xlsx）をアップロードしてください。
          法人名が既存の顧客と一致しない場合は新規に顧客を作成します。
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          列名: 法人名, 氏名, フリガナ, 国籍, 生年月日, 旅券番号, 在留カード番号, 在留資格, 在留期限
        </p>
      </div>
      <ExcelImportForm />
    </div>
  );
}
