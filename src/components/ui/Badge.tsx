import React from 'react';
import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'emerald' | 'rose' | 'slate' | 'amber';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'slate', children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    let variantStyles = '';
    switch (variant) {
      case 'emerald':
        variantStyles = 'bg-emerald-500/10 text-emerald-400';
        break;
      case 'rose':
        variantStyles = 'bg-rose-500/10 text-rose-400';
        break;
      case 'slate':
        variantStyles = 'bg-slate-700 text-slate-300';
        break;
      case 'amber':
        variantStyles = 'bg-amber-500/10 text-amber-400';
        break;
    }

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`.trim()}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

