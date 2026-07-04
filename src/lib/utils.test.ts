import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('結合する', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('条件付きクラスを無視する', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('後から指定した重複クラスで上書きする(twMerge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
