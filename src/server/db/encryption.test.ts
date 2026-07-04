import { describe, expect, it } from 'vitest';
import { decryptField, encryptField, hashForLookup } from './encryption';

describe('encryptField / decryptField', () => {
  it('暗号化した値を復号すると元の平文に戻る', () => {
    const plain = 'AB1234567';
    const encrypted = encryptField(plain);
    expect(encrypted).not.toBe(plain);
    expect(decryptField(encrypted)).toBe(plain);
  });

  it('同じ平文でも暗号化結果は毎回異なる(IVがランダムなため)', () => {
    const plain = 'AB1234567';
    expect(encryptField(plain)).not.toBe(encryptField(plain));
  });

  it('改ざんされた暗号文の復号はエラーになる(認証タグ検証)', () => {
    const encrypted = encryptField('AB1234567');
    const tampered = Buffer.from(encrypted, 'base64');
    tampered[tampered.length - 1] ^= 0xff;
    expect(() => decryptField(tampered.toString('base64'))).toThrow();
  });
});

describe('hashForLookup', () => {
  it('同じ値は常に同じハッシュになる(検索用途のため決定的)', () => {
    expect(hashForLookup('AB1234567')).toBe(hashForLookup('AB1234567'));
  });

  it('前後の空白・大文字小文字の違いを吸収して同一とみなす', () => {
    expect(hashForLookup(' ab1234567 ')).toBe(hashForLookup('AB1234567'));
  });

  it('異なる値は異なるハッシュになる', () => {
    expect(hashForLookup('AB1234567')).not.toBe(hashForLookup('AB1234568'));
  });
});
