import { redirect } from 'next/navigation';
import { CsvTemplateForm } from '@/features/csv-templates/csv-template-form';
import { CsvTemplateList } from '@/features/csv-templates/csv-template-list';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { listCsvTemplates } from '@/server/repositories/csv-template-repository';

export default async function CsvTemplatesSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== UserRole.ADMIN) redirect('/dashboard');

  const templates = await listCsvTemplates(session.user.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">CSVテンプレート管理</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          入管オンライン提出用CSVの出力項目を設定します。保存すると新しいバージョンが作成され、
          それ以前のバージョンは無効化されます（過去の出力内容を再現できるよう履歴は保持されます）。
        </p>
      </div>
      <CsvTemplateForm />
      <CsvTemplateList templates={templates} />
    </div>
  );
}
