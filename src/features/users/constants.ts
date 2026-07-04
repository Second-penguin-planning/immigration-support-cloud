import { UserRole } from '@/generated/prisma/enums';

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: '管理者',
  STAFF: 'スタッフ',
  VIEWER: '閲覧のみ',
};

export const ROLE_OPTIONS = [UserRole.ADMIN, UserRole.STAFF, UserRole.VIEWER] as const;
