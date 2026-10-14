import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  zIndex?: string;
}

let openModalsCount = 0;

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = 'md', 
  className = '',
  zIndex = 'z-50' 
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    openModalsCount++;
    if (openModalsCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      openModalsCount = Math.max(0, openModalsCount - 1);
      if (openModalsCount === 0) {
        document.body.style.overflow = '';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  let maxWidthClass = '';
  switch (maxWidth) {
    case 'sm': maxWidthClass = 'max-w-sm'; break;
    case 'md': maxWidthClass = 'max-w-md'; break;
    case 'lg': maxWidthClass = 'max-w-lg'; break;
    case 'xl': maxWidthClass = 'max-w-xl'; break;
    case '2xl': maxWidthClass = 'max-w-2xl'; break;
    case '3xl': maxWidthClass = 'max-w-3xl'; break;
  }

  return createPortal(
    <div 
      className={`fixed inset-0 ${zIndex} overflow-y-auto flex min-h-full items-center justify-center p-4`}
      onClick={onClose}
    >
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity pointer-events-none" 
        aria-hidden="true"
      />
      
      <div 
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/40 w-full ${maxWidthClass} relative z-10 animate-in zoom-in-95 duration-200 my-auto ${className}`.trim()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
