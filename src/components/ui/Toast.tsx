import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../icons';
import { cx } from '../../lib/cx';
import { ToastContext } from './toast-context';
import styles from './Toast.module.css';

interface ToastItem {
  id: number;
  message: string;
  tone: 'neutral' | 'error';
}

const DISMISS_AFTER_MS = 3200;

/** Transient confirmations, announced politely rather than trapping focus. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const notify = useCallback((message: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, DISMISS_AFTER_MS);
  }, []);

  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={cx(styles.toast, item.tone === 'error' && styles.error)}>
            <Icon name={item.tone === 'error' ? 'alert' : 'circleCheck'} size={16} />
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
