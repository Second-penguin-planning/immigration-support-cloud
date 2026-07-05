import { describe, expect, it } from 'vitest';
import { buildStorageKey, sanitizeFileNameComponent } from './local-storage';

describe('sanitizeFileNameComponent', () => {
  it('スペースやハイフンは残す', () => {
    expect(sanitizeFileNameComponent('田中 花子-書類')).toBe('田中 花子-書類');
  });

  it('パス区切り文字や記号は置換する', () => {
    expect(sanitizeFileNameComponent('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('空文字・空白のみの場合はfileにフォールバックする', () => {
    expect(sanitizeFileNameComponent('')).toBe('file');
    expect(sanitizeFileNameComponent('   ')).toBe('file');
  });
});

describe('buildStorageKey', () => {
  it('英数字・ハイフン・アンダースコアのセグメントを / で結合する', () => {
    expect(buildStorageKey('tenant123', 'fn_456', 'doc-789')).toBe('tenant123/fn_456/doc-789');
  });

  it('不正な文字を含むセグメントは例外を投げる(パストラバーサル対策)', () => {
    expect(() => buildStorageKey('../etc/passwd')).toThrow();
    expect(() => buildStorageKey('tenant/../../secret')).toThrow();
  });
});
