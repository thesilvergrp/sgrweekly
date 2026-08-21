import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  /** Two-digit section index, e.g. "01". Part of the design system's signature. */
  index?: string;
  overline?: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Optional trailing content, e.g. a link or a count. */
  aside?: ReactNode;
  /** Rendered next to the title — used for the admin "Edit" chip. */
  action?: ReactNode;
  id?: string;
  className?: string;
  as?: 'h2' | 'h3';
}

export function SectionHeading({
  index,
  overline,
  title,
  lede,
  aside,
  action,
  id,
  className,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <div className={cx(styles.heading, className)}>
      {index && <p className={styles.index}>{index}</p>}
      <div>
        {overline && <span className={styles.overline}>{overline}</span>}
        <Tag className={styles.title} id={id}>
          {title}
          {action}
        </Tag>
        {lede && <p className={styles.lede}>{lede}</p>}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
}
