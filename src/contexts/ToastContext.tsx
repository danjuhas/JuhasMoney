import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '../components/Toast';

type ToastType = 'success' | 'error';

interface ToastContextData {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');

  const addToast = useCallback((newMessage: string, newType: ToastType = 'success') => {
    setMessage(newMessage);
    setType(newType);
  }, []);

  const handleClose = useCallback(() => {
    setMessage('');
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {message && <Toast message={message} type={type} onClose={handleClose} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
