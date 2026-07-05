import type { CsvExportTemplate } from '@/generated/prisma/client';
import type { CsvTemplateDefinition } from './constants';

export function CsvTemplateList({ templates }: { templates: CsvExportTemplate[] }) {
  if (templates.length === 0) {
    return <p className="text-muted-foreground text-sm">テンプレートはまだ作成されていません。</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-border text-muted-foreground border-b">
          <th className="py-2 pr-4 font-medium">名前</th>
          <th className="py-2 pr-4 font-medium">バージョン</th>
          <th className="py-2 pr-4 font-medium">エンコーディング</th>
          <th className="py-2 pr-4 font-medium">項目数</th>
          <th className="py-2 pr-4 font-medium">状態</th>
          <th className="py-2 pr-4 font-medium">作成日</th>
        </tr>
      </thead>
      <tbody>
        {templates.map((template) => {
          const definition = template.columnDefinition as unknown as CsvTemplateDefinition;
          return (
            <tr key={template.id} className="border-border border-b">
              <td className="py-2 pr-4">{template.name}</td>
              <td className="py-2 pr-4">v{template.version}</td>
              <td className="py-2 pr-4">
                {definition.encoding === 'shift_jis' ? 'Shift_JIS' : 'UTF-8'}
              </td>
              <td className="py-2 pr-4">{definition.columns.length}</td>
              <td className="py-2 pr-4">{template.isActive ? '有効' : '無効'}</td>
              <td className="py-2 pr-4">{template.createdAt.toLocaleDateString('ja-JP')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
