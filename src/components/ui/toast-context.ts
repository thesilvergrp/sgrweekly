import { createContext, useContext } from 'react';

export interface ToastApi {
  notify: (message: string, tone?: 'neutral' | 'error') => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
