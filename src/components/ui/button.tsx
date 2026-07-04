import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const VARIANT_CLASS = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'border border-border bg-transparent hover:bg-muted',
  danger: 'bg-danger text-white hover:opacity-90',
} as const;

const BUTTON_CLASS =
  'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof VARIANT_CLASS;
}

export function Button({ variant = 'primary', className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(BUTTON_CLASS, VARIANT_CLASS[variant], className)}
      disabled={disabled}
      {...props}
    />
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: keyof typeof VARIANT_CLASS;
}

/** ボタンの見た目をした遷移リンク（一覧→新規作成画面 等）。 */
export function LinkButton({ variant = 'primary', className, ...props }: LinkButtonProps) {
  return <Link className={cn(BUTTON_CLASS, VARIANT_CLASS[variant], className)} {...props} />;
}
