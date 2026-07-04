import { Button } from '@/components/ui/button';
import type { User } from '@/generated/prisma/client';
import { toggleUserActiveAction, updateUserRoleAction } from './actions';
import { ROLE_LABEL, ROLE_OPTIONS } from './constants';

export function UserTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-border text-muted-foreground border-b">
          <th className="py-2 pr-4 font-medium">氏名</th>
          <th className="py-2 pr-4 font-medium">メールアドレス</th>
          <th className="py-2 pr-4 font-medium">権限</th>
          <th className="py-2 pr-4 font-medium">メール認証</th>
          <th className="py-2 pr-4 font-medium">状態</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <tr key={user.id} className="border-border border-b">
              <td className="py-2 pr-4">{user.name}</td>
              <td className="py-2 pr-4">{user.email}</td>
              <td className="py-2 pr-4">
                {isSelf ? (
                  ROLE_LABEL[user.role]
                ) : (
                  <form action={updateUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="border-border bg-background h-8 rounded-md border px-2 text-sm"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" className="h-8 px-2 text-xs">
                      更新
                    </Button>
                  </form>
                )}
              </td>
              <td className="py-2 pr-4">{user.emailVerified ? '認証済み' : '未認証'}</td>
              <td className="py-2 pr-4">
                {isSelf ? (
                  user.isActive ? (
                    '有効'
                  ) : (
                    '無効'
                  )
                ) : (
                  <form action={toggleUserActiveAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                    <Button
                      type="submit"
                      variant={user.isActive ? 'danger' : 'secondary'}
                      className="h-8 px-2 text-xs"
                    >
                      {user.isActive ? '無効化' : '有効化'}
                    </Button>
                  </form>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
