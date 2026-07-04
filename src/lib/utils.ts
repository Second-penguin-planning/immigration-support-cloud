import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwindクラスを安全に結合するユーティリティ。
 * 条件付きクラスと重複クラスの上書き(twMerge)を両立する。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
