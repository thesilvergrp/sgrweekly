import { cx } from '../../lib/cx';
import styles from './BrandMark.module.css';

interface BrandMarkProps {
  /** Renders for a dark background. */
  inverse?: boolean;
  className?: string;
}

/**
 * Original brand mark drawn for this rebuild: a gabled roofline over a
 * horizon rule. It replaces the previous house-glyph-plus-script-font lockup
 * and the S3-hosted raster logo, so nothing on the page depends on an external
 * image loading. The S3 object itself is untouched (config/assets.ts).
 */
export function BrandMark({ inverse = false, className }: BrandMarkProps) {
  return (
    <span className={cx(styles.brand, inverse && styles.inverse, className)}>
      <svg
        className={styles.glyph}
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
      >
        <rect x="0.75" y="0.75" width="32.5" height="32.5" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 20.5 17 9.5l9 11"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M11 25.5h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <span className={styles.words}>
        <span className={styles.name}>Silver Group</span>
        <span className={styles.kicker}>Atlanta Stays</span>
      </span>
    </span>
  );
}
