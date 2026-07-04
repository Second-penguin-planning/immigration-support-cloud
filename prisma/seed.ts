import { hashSync } from 'bcryptjs';
import { logger } from '@/lib/logger';
import { prisma } from '@/server/db/client';

const DEMO_PASSWORD = 'Password123!';

async function resetData() {
  // 依存関係の子から順に削除する(FKはCascadeだがローカルseedの見通しを良くするため明示)。
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.supportRecord.deleteMany();
  await prisma.periodicReport.deleteMany();
  await prisma.document.deleteMany();
  await prisma.residenceStatus.deleteMany();
  await prisma.foreignNational.deleteMany();
  await prisma.csvExportTemplate.deleteMany();
  await prisma.client.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

async function main() {
  await resetData();

  const tenant = await prisma.tenant.create({
    data: { name: 'サンプル行政書士事務所' },
  });

  const passwordHash = hashSync(DEMO_PASSWORD, 10);

  const [admin, staff] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@example.com',
        name: '管理者 太郎',
        role: 'ADMIN',
        passwordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'staff@example.com',
        name: 'スタッフ 花子',
        role: 'STAFF',
        passwordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'viewer@example.com',
        name: '閲覧 次郎',
        role: 'VIEWER',
        passwordHash,
        emailVerified: new Date(),
      },
    }),
  ]);

  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      companyName: '株式会社サンプル商事',
      address: '東京都千代田区丸の内1-1-1',
      contactName: '担当 一郎',
      contactEmail: 'contact@sample-shoji.example.com',
      assignedUserId: staff.id,
    },
  });

  const foreignNational = await prisma.foreignNational.create({
    data: {
      clientId: client.id,
      fullName: 'グエン ヴァン アン',
      fullNameKana: 'グエン ヴァン アン',
      nationality: 'ベトナム',
      birthDate: new Date('1998-04-01'),
      passportNumber: 'N1234567',
      residenceCardNumber: 'AB12345678CD',
    },
  });

  await prisma.residenceStatus.create({
    data: {
      foreignNationalId: foreignNational.id,
      statusType: '特定技能1号',
      grantedAt: new Date('2024-08-01'),
      expiresAt: new Date('2026-08-15'),
    },
  });

  await prisma.csvExportTemplate.create({
    data: {
      tenantId: tenant.id,
      name: '入管オンライン標準テンプレート',
      version: 1,
      columnDefinition: {
        encoding: 'Shift_JIS',
        columns: [
          { key: 'fullName', label: '氏名', required: true },
          { key: 'nationality', label: '国籍', required: true },
          { key: 'residenceCardNumber', label: '在留カード番号', required: true },
          { key: 'statusType', label: '在留資格', required: true },
          { key: 'expiresAt', label: '在留期限', required: true },
        ],
      },
    },
  });

  logger.info('seed完了', {
    tenantId: tenant.id,
    users: [admin.email, staff.email],
    clientId: client.id,
    foreignNationalId: foreignNational.id,
  });
}

main()
  .catch((error: unknown) => {
    logger.error('seed失敗', { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
