import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons';
import { cx } from '../../lib/cx';
import styles from './Notice.module.css';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const TONE_ICON: Record<NoticeTone, IconName> = {
  info: 'info',
  success: 'circleCheck',
  warning: 'alert',
  error: 'circleCross',
};

interface NoticeProps {
  tone?: NoticeTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  /** Technical detail, hidden behind a disclosure. */
  detail?: string;
  className?: string;
}

/** Every visible error, warning and confirmation in the app renders through here. */
export function Notice({ tone = 'info', title, children, actions, detail, className }: NoticeProps) {
  return (
    <div
      className={cx(styles.notice, styles[tone], className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.icon}>
        <Icon name={TONE_ICON[tone]} size={18} />
      </span>
      <div>
        <p className={styles.title}>{title}</p>
        {children && <div className={styles.body}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
        {detail && (
          <details className={styles.details}>
            <summary>Technical detail</summary>
            <code className={styles.detailText}>{detail}</code>
          </details>
        )}
      </div>
    </div>
  );
}
