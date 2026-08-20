import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons';
import { cx } from '../../lib/cx';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = 'compass', title, children, actions, className }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      <span className={styles.icon}>
        <Icon name={icon} size={28} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {children && <p className={styles.body}>{children}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
