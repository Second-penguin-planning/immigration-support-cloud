import { describe, expect, it } from 'vitest';
import { csvTemplateFormSchema } from './schema';

describe('csvTemplateFormSchema', () => {
  it('必須項目が揃っていれば有効', () => {
    const result = csvTemplateFormSchema.safeParse({
      name: '標準テンプレート',
      encoding: 'shift_jis',
      optionalColumns: ['fullNameKana'],
    });
    expect(result.success).toBe(true);
  });

  it('optionalColumnsを省略してもデフォルトで空配列になる', () => {
    const result = csvTemplateFormSchema.safeParse({
      name: '標準テンプレート',
      encoding: 'utf-8',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.optionalColumns).toEqual([]);
    }
  });

  it('存在しない列キーはエラーになる', () => {
    const result = csvTemplateFormSchema.safeParse({
      name: '標準テンプレート',
      encoding: 'utf-8',
      optionalColumns: ['not_a_real_field'],
    });
    expect(result.success).toBe(false);
  });

  it('不正なencodingはエラーになる', () => {
    const result = csvTemplateFormSchema.safeParse({
      name: '標準テンプレート',
      encoding: 'euc-jp',
      optionalColumns: [],
    });
    expect(result.success).toBe(false);
  });

  it('テンプレート名が空だとエラーになる', () => {
    const result = csvTemplateFormSchema.safeParse({
      name: '',
      encoding: 'utf-8',
      optionalColumns: [],
    });
    expect(result.success).toBe(false);
  });
});
