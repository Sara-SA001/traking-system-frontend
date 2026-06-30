'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-blue-700 text-white hover:bg-blue-800',
        variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        variant === 'outline' && 'border border-slate-200 bg-white hover:bg-slate-50',
        variant === 'ghost' && 'hover:bg-slate-100 hover:text-slate-900',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
        size === 'default' && 'h-11 px-4 py-2',
        size === 'sm' && 'h-9 rounded-lg px-3',
        size === 'lg' && 'h-12 rounded-xl px-6',
        size === 'icon' && 'h-10 w-10',
        className,
      )}
      {...props}
    />
  );
}
