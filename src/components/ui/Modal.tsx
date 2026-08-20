import { useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useOnEscape } from '../../hooks/useOnEscape';
import { useScrollLock } from '../../hooks/useScrollLock';
import { cx } from '../../lib/cx';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Removes body padding — for galleries and embeds. */
  flush?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * The only dialog primitive in the app: portalled, labelled, focus-trapped,
 * Escape-closable, scroll-locking, and focus-restoring on close.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  flush = false,
  footer,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `${title.replace(/\W+/g, '-').toLowerCase()}-dialog-title`;

  const handleClose = useCallback(() => onClose(), [onClose]);

  useOnEscape(open, handleClose);
  useScrollLock(open);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.scrim} onClick={handleClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(styles.panel, styles[size])}
      >
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={handleClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className={cx(styles.body, flush && styles.bodyFlush)}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
