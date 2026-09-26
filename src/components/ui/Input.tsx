import React from 'react';
import type { InputHTMLAttributes } from 'react';

export type InputFocusColor = 'default' | 'emerald' | 'rose';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  focusColor?: InputFocusColor;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', focusColor = 'default', icon, wrapperClassName = '', ...props }, ref) => {
    
    let baseStyles = 'w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all';
    
    let focusStyles = '';
    switch (focusColor) {
      case 'emerald':
        focusStyles = 'focus:ring-emerald-500/50 focus:border-emerald-500/50';
        break;
      case 'rose':
        focusStyles = 'focus:ring-rose-500/50 focus:border-rose-500/50';
        break;
      case 'default':
        focusStyles = 'focus:ring-blue-500/50 focus:border-blue-500/50'; // Default JuhasMoney doesn't have blue, maybe emerald is default? Let's use slate for default
        focusStyles = 'focus:ring-slate-500/50 focus:border-slate-500/50';
        break;
    }

    const iconPadding = icon ? 'pl-11' : '';

    const finalClassName = `${baseStyles} ${focusStyles} ${iconPadding} ${className}`.trim();

    if (icon) {
      return (
        <div className={`relative ${wrapperClassName}`}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
          <input ref={ref} className={finalClassName} {...props} />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={finalClassName}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

