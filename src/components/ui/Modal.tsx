import type { ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  zIndex?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = 'md', 
  className = '',
  zIndex = 'z-50' 
}: ModalProps) {
  if (!isOpen) return null;

  let maxWidthClass = '';
  switch (maxWidth) {
    case 'sm': maxWidthClass = 'max-w-sm'; break;
    case 'md': maxWidthClass = 'max-w-md'; break;
    case 'lg': maxWidthClass = 'max-w-lg'; break;
    case 'xl': maxWidthClass = 'max-w-xl'; break;
    case '2xl': maxWidthClass = 'max-w-2xl'; break;
    case '3xl': maxWidthClass = 'max-w-3xl'; break;
  }

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div 
        className={`bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/40 w-full ${maxWidthClass} relative z-10 animate-in zoom-in-95 duration-200 ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}

