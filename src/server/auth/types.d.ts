import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/generated/prisma/enums';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    tenantId: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
    } & DefaultSession['user'];
  }
}

// next-auth/jwt の JWT 型は @auth/core/jwt からの re-export のため、ここでの
// 宣言マージ(`declare module 'next-auth/jwt'`)は反映されない。
// token.role / token.tenantId へのアクセスは src/server/auth/config.ts でキャストして扱う。
