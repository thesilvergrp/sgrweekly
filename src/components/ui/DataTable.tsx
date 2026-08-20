import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './DataTable.module.css';

interface DataTableProps {
  /** Always supplied; visually styled, and read by assistive tech. */
  caption: string;
  head?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Tabular data primitive. The wrapper scrolls horizontally on narrow screens so
 * the page body never does.
 */
export function DataTable({ caption, head, children, className }: DataTableProps) {
  return (
    <div className={cx(styles.wrapper, className)}>
      <table className={styles.table}>
        <caption>{caption}</caption>
        {head && <thead>{head}</thead>}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
