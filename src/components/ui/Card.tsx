import React from 'react';
import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', children, ...props }, ref) => {
    
    const baseStyles = 'bg-slate-800 border border-slate-700 shadow-lg shadow-black/20 rounded-2xl';
    
    let paddingStyles = '';
    switch (padding) {
      case 'none': paddingStyles = ''; break;
      case 'sm': paddingStyles = 'p-4'; break;
      case 'md': paddingStyles = 'p-6'; break;
      case 'lg': paddingStyles = 'p-8'; break;
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${paddingStyles} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

