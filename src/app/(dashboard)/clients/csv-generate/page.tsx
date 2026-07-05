import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buildCsvGenerationRows } from '@/features/csv-templates/build-rows';
import { clientSearchSchema } from '@/features/clients/schema';
import { UserRole } from '@/generated/prisma/enums';
import { validateTemplateRow } from '@/lib/csv-template';
import { auth } from '@/server/auth';
import { findClients } from '@/server/repositories/client-repository';
import { findActiveCsvTemplate } from '@/server/repositories/csv-template-repository';
import type { CsvTemplateDefinition } from '@/features/csv-templates/constants';

export default async function CsvGeneratePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === UserRole.VIEWER) redirect('/clients');

  const template = await findActiveCsvTemplate(session.user.tenantId);

  if (!template) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">入管提出用CSV生成</h1>
        <p className="text-muted-foreground text-sm">
          CSVテンプレートがまだ作成されていません。先にテンプレートを作成してください。
        </p>
        <Link href="/settings/csv-templates" className="underline">
          CSVテンプレート管理へ
        </Link>
      </div>
    );
  }

  const rawParams = await searchParams;
  const singleValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const rawFilters = {
    companyName: singleValue(rawParams.companyName),
    fullName: singleValue(rawParams.fullName),
    residenceCardNumber: singleValue(rawParams.residenceCardNumber),
    assignedUserId: singleValue(rawParams.assignedUserId),
    expiresFrom: singleValue(rawParams.expiresFrom),
    expiresTo: singleValue(rawParams.expiresTo),
  };
  const parsed = clientSearchSchema.safeParse(rawFilters);
  const filters = parsed.success ? parsed.data : {};

  const clients = await findClients(session.user.tenantId, filters);
  const rows = buildCsvGenerationRows(clients);
  const definition = template.columnDefinition as unknown as CsvTemplateDefinition;

  const results = rows.map((row) => ({
    ...row,
    validation: validateTemplateRow(definition, row.source),
  }));
  const invalidRows = results.filter((row) => row.validation.missingFieldLabels.length > 0);
  const canDownload = rows.length > 0 && invalidRows.length === 0;

  const downloadQuery = new URLSearchParams(
    Object.entries(rawFilters).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">入管提出用CSV生成</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          テンプレート: {template.name}（v{template.version}、
          {definition.encoding === 'shift_jis' ? 'Shift_JIS' : 'UTF-8'}）。 `/clients`
          の検索条件を引き継いで生成対象を絞り込めます。
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">対象となる外国人情報がありません。</p>
      ) : (
        <>
          <p className="text-sm">
            {rows.length}件中 <strong>{rows.length - invalidRows.length}件</strong> が生成可能です
            {invalidRows.length > 0 && `（${invalidRows.length}件に不備があります）`}。
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b">
                <th className="py-2 pr-4 font-medium">法人名</th>
                <th className="py-2 pr-4 font-medium">氏名</th>
                <th className="py-2 pr-4 font-medium">状態</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.foreignNationalId} className="border-border border-b">
                  <td className="py-2 pr-4">{row.companyName}</td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/clients/${row.clientId}/foreign-nationals/${row.foreignNationalId}`}
                      className="underline"
                    >
                      {row.foreignNationalName}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    {row.validation.missingFieldLabels.length === 0 ? (
                      <span className="text-primary">OK</span>
                    ) : (
                      <span className="text-danger">
                        不足: {row.validation.missingFieldLabels.join('、')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invalidRows.length > 0 && (
            <p className="text-danger text-sm">
              不備のある行があるため生成をブロックしています。各外国人の詳細画面で不足項目を修正してください。
            </p>
          )}
          {canDownload && (
            <a
              href={`/api/clients/csv-generate${downloadQuery ? `?${downloadQuery}` : ''}`}
              className="border-border hover:bg-muted inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
            >
              CSVを生成してダウンロード
            </a>
          )}
        </>
      )}
    </div>
  );
}
