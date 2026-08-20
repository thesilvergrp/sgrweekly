import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Tag.module.css';

interface TagProps {
  tone?: 'neutral' | 'accent' | 'available' | 'muted';
  children: ReactNode;
  className?: string;
}

export function Tag({ tone = 'neutral', children, className }: TagProps) {
  return <span className={cx(styles.tag, styles[tone], className)}>{children}</span>;
}
