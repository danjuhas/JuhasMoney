import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
    
    let baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
    
    let variantStyles = '';
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25';
        break;
      case 'danger':
        variantStyles = 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25';
        break;
      case 'secondary':
        variantStyles = 'bg-slate-700 hover:bg-slate-600 text-slate-100';
        break;
      case 'ghost':
        variantStyles = 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-slate-100';
        break;
      case 'outline':
        variantStyles = 'bg-transparent border-2 border-emerald-500/50 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400';
        break;
    }

    let sizeStyles = '';
    switch (size) {
      case 'sm':
        sizeStyles = 'px-3 py-1.5 text-sm gap-1.5';
        break;
      case 'md':
        sizeStyles = 'px-4 py-2 text-sm gap-2';
        break;
      case 'lg':
        sizeStyles = 'px-5 py-2.5 text-base gap-2';
        break;
    }

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

