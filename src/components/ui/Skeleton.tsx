import type { CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  /** Renders at text proportions. */
  text?: boolean;
  radius?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Placeholder block. Always rendered inside a container marked `aria-busy`, and
 * never announced itself — screen readers get the status message instead.
 */
export function Skeleton({ width, height, text = false, radius, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(styles.skeleton, text && styles.text, className)}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
