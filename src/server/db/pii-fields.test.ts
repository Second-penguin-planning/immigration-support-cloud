import { describe, expect, it } from 'vitest';
import { decryptReadResult, encryptWritePayload } from './pii-fields';

describe('encryptWritePayload', () => {
  it('単一オブジェクトの対象フィールドを暗号化しハッシュ列を追加する', () => {
    const input: Record<string, unknown> = { fullName: '山田太郎', passportNumber: 'AB1234567' };
    const output = encryptWritePayload(input);

    expect(output.fullName).toBe('山田太郎'); // 対象外フィールドは素通り
    expect(output.passportNumber).not.toBe('AB1234567');
    expect(typeof output.passportNumberHash).toBe('string');
  });

  it('配列(createMany相当)の各要素を暗号化する', () => {
    const input = [{ passportNumber: 'AB1111111' }, { passportNumber: 'AB2222222' }];
    const output = encryptWritePayload(input);

    expect(output).toHaveLength(2);
    expect(output[0].passportNumber).not.toBe('AB1111111');
    expect(output[1].passportNumber).not.toBe('AB2222222');
  });

  it('nullを渡すとハッシュ列もnullにする(値のクリア操作)', () => {
    const output = encryptWritePayload<Record<string, unknown>>({ passportNumber: null });
    expect(output.passportNumber).toBeNull();
    expect(output.passportNumberHash).toBeNull();
  });

  it('対象フィールドが存在しないオブジェクトはそのまま返す', () => {
    const input = { fullName: '山田太郎' };
    expect(encryptWritePayload(input)).toEqual(input);
  });

  it('プリミティブ(where句のスカラー等)はそのまま返す', () => {
    expect(encryptWritePayload('some-id')).toBe('some-id');
    expect(encryptWritePayload(undefined)).toBeUndefined();
  });
});

describe('decryptReadResult', () => {
  it('暗号化して書き込んだ値を読み取り時に復号できる(往復)', () => {
    const written = encryptWritePayload({ passportNumber: 'AB1234567' });
    const read = decryptReadResult(written);
    expect(read.passportNumber).toBe('AB1234567');
  });

  it('配列(findMany相当)の各要素を復号する', () => {
    const written = encryptWritePayload([
      { passportNumber: 'AB1111111' },
      { passportNumber: 'AB2222222' },
    ]);
    const read = decryptReadResult(written);
    expect(read.map((r) => r.passportNumber)).toEqual(['AB1111111', 'AB2222222']);
  });

  it('count()等のスカラー結果はそのまま返す', () => {
    expect(decryptReadResult(3)).toBe(3);
    expect(decryptReadResult(null)).toBeNull();
  });
});
