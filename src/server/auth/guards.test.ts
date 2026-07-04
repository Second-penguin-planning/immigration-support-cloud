import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.fn();

vi.mock('./index', () => ({
  auth: authMock,
}));

const { AuthzError, requireRole, requireSession } = await import('./guards');

function sessionWithRole(role: 'ADMIN' | 'STAFF' | 'VIEWER') {
  return {
    user: { id: 'u1', role, tenantId: 't1', email: 'a@example.com', name: 'テスト' },
    expires: '2099-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  authMock.mockReset();
});

describe('requireSession', () => {
  it('セッションがあればそのまま返す', async () => {
    authMock.mockResolvedValue(sessionWithRole('STAFF'));
    const session = await requireSession();
    expect(session.user.id).toBe('u1');
  });

  it('未ログインならAuthzErrorを投げる', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSession()).rejects.toThrow(AuthzError);
  });
});

describe('requireRole', () => {
  it('許可されたロールなら通過する', async () => {
    authMock.mockResolvedValue(sessionWithRole('ADMIN'));
    await expect(requireRole('ADMIN', 'STAFF')).resolves.toBeTruthy();
  });

  it('許可されていないロールならAuthzErrorを投げる', async () => {
    authMock.mockResolvedValue(sessionWithRole('VIEWER'));
    await expect(requireRole('ADMIN')).rejects.toThrow(AuthzError);
  });

  it('未ログインでもAuthzErrorを投げる', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireRole('ADMIN')).rejects.toThrow(AuthzError);
  });
});
