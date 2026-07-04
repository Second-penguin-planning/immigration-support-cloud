import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const VARIANT_CLASS = {
  error: 'border-danger/30 bg-danger/10 text-danger',
  success: 'border-primary/30 bg-primary/10 text-primary',
} as const;

interface AlertProps extends ComponentProps<'div'> {
  variant?: keyof typeof VARIANT_CLASS;
}

export function Alert({ variant = 'error', className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('rounded-md border px-3 py-2 text-sm', VARIANT_CLASS[variant], className)}
      {...props}
    />
  );
}
