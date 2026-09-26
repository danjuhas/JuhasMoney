import React from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  focusColor?: 'emerald' | 'rose' | 'purple';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', focusColor = 'emerald', ...props }, ref) => {
    
    let focusRing = 'focus:ring-emerald-500 focus:border-emerald-500';
    if (focusColor === 'rose') focusRing = 'focus:ring-rose-500 focus:border-rose-500';
    if (focusColor === 'purple') focusRing = 'focus:ring-purple-500 focus:border-purple-500';

    return (
      <select
        ref={ref}
        className={`w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 outline-none transition-all focus:ring-2 ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);

Select.displayName = 'Select';
