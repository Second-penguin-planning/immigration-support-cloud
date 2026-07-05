import { NextResponse } from 'next/server';
import { UserRole } from '@/generated/prisma/enums';
import { auth } from '@/server/auth';
import { findDocumentById } from '@/server/repositories/document-repository';
import { readStoredFile } from '@/server/storage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
  }
  // 閲覧のみ(viewer)ロールはダウンロード不可(docs/01_requirements.md 1.1)
  if (session.user.role === UserRole.VIEWER) {
    return NextResponse.json({ message: 'この操作を行う権限がありません。' }, { status: 403 });
  }

  const { documentId } = await params;
  const document = await findDocumentById(session.user.tenantId, documentId);
  if (!document) {
    return NextResponse.json({ message: 'ファイルが見つかりません。' }, { status: 404 });
  }

  const buffer = await readStoredFile(document.storagePath);
  const encodedFileName = encodeURIComponent(document.storedFileName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="document"; filename*=UTF-8''${encodedFileName}`,
    },
  });
}
