import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { decryptReadResult, encryptWritePayload } from './pii-fields';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const adapter = new PrismaPg({ connectionString });

  // ForeignNational の旅券番号・在留カード番号は、書き込み時に暗号化+検索用ハッシュ付与、
  // 読み取り時に復号を透過的に行う（アプリケーションコードは常に平文として扱える）。
  return new PrismaClient({ adapter }).$extends({
    query: {
      foreignNational: {
        async $allOperations({ args, query }) {
          const writable = args as { data?: unknown; create?: unknown; update?: unknown };
          if ('data' in writable) writable.data = encryptWritePayload(writable.data);
          if ('create' in writable) writable.create = encryptWritePayload(writable.create);
          if ('update' in writable) writable.update = encryptWritePayload(writable.update);

          const result = await query(args);
          return decryptReadResult(result);
        },
      },
    },
  });
}

declare global {
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

/** アプリケーション全体で共有するPrisma Clientのシングルトン。 */
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
