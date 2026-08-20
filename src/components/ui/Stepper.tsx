import { useId } from 'react';
import { Icon } from '../icons';
import styles from './Stepper.module.css';

interface StepperProps {
  label: string;
  caption?: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  /** Rendered as the accessible value, e.g. "4 guests". */
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

/**
 * Numeric stepper. The value is a live region so screen readers hear the new
 * count rather than only the button that changed it.
 */
export function Stepper({
  label,
  caption,
  value,
  min = 0,
  max,
  onChange,
  formatValue,
  disabled = false,
}: StepperProps) {
  const labelId = useId();
  const announced = formatValue ? formatValue(value) : `${value}`;

  return (
    <div className={styles.stepper} role="group" aria-labelledby={labelId}>
      <span className={styles.text}>
        <span className={styles.label} id={labelId}>
          {label}
        </span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </span>

      <span className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <Icon name="minus" size={16} />
        </button>

        <span className={styles.value} aria-live="polite" aria-atomic="true">
          <span className="u-visually-hidden">{announced}</span>
          <span aria-hidden="true">{value}</span>
        </span>

        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <Icon name="plus" size={16} />
        </button>
      </span>
    </div>
  );
}
