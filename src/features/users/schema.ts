import { z } from 'zod';
import { UserRole } from '@/generated/prisma/enums';

export const inviteUserSchema = z.object({
  name: z.string().trim().min(1, '氏名を入力してください'),
  email: z
    .string()
    .trim()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF, UserRole.VIEWER]),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF, UserRole.VIEWER]),
});

export const toggleUserActiveSchema = z.object({
  userId: z.string().min(1),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true'),
});
