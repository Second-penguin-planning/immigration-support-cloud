import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientSearchValues } from './schema';

interface ClientSearchFormProps {
  users: { id: string; name: string }[];
  defaultValues: Partial<Record<keyof ClientSearchValues, string>>;
}

function toDateInputValue(value?: string): string | undefined {
  return value;
}

export function ClientSearchForm({ users, defaultValues }: ClientSearchFormProps) {
  return (
    <form
      method="get"
      className="border-border flex flex-wrap items-end gap-3 rounded-md border p-4"
    >
      <div>
        <Label htmlFor="companyName">法人名</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={defaultValues.companyName}
          className="w-40"
        />
      </div>
      <div>
        <Label htmlFor="fullName">外国人氏名</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultValues.fullName}
          className="w-40"
        />
      </div>
      <div>
        <Label htmlFor="residenceCardNumber">在留カード番号</Label>
        <Input
          id="residenceCardNumber"
          name="residenceCardNumber"
          defaultValue={defaultValues.residenceCardNumber}
          placeholder="完全一致で検索"
          className="w-44"
        />
      </div>
      <div>
        <Label htmlFor="assignedUserId">担当者</Label>
        <select
          id="assignedUserId"
          name="assignedUserId"
          defaultValue={defaultValues.assignedUserId ?? ''}
          className="border-border bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="">すべて</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="expiresFrom">在留期限(From)</Label>
        <Input
          id="expiresFrom"
          name="expiresFrom"
          type="date"
          defaultValue={toDateInputValue(defaultValues.expiresFrom)}
        />
      </div>
      <div>
        <Label htmlFor="expiresTo">在留期限(To)</Label>
        <Input
          id="expiresTo"
          name="expiresTo"
          type="date"
          defaultValue={toDateInputValue(defaultValues.expiresTo)}
        />
      </div>
      <Button type="submit">検索</Button>
    </form>
  );
}
