import * as React from 'react';
import { cn } from '../../lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' | 'success' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' && 'bg-blue-100 text-blue-800',
        variant === 'secondary' && 'bg-slate-100 text-slate-700',
        variant === 'outline' && 'border border-slate-200 text-slate-700',
        variant === 'success' && 'bg-emerald-100 text-emerald-700',
        variant === 'danger' && 'bg-red-100 text-red-700',
        className,
      )}
      {...props}
    />
  );
}
