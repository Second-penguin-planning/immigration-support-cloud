import { describe, expect, it } from 'vitest';
import { generateRawToken, hashToken } from './tokens';

describe('generateRawToken', () => {
  it('毎回異なるトークンを生成する', () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });

  it('URLセーフな文字のみを含む', () => {
    const token = generateRawToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('hashToken', () => {
  it('同じトークンは常に同じハッシュになる', () => {
    const token = generateRawToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('異なるトークンは異なるハッシュになる', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('ハッシュから元のトークンは復元できない(不可逆)', () => {
    const token = generateRawToken();
    expect(hashToken(token)).not.toBe(token);
  });
});
