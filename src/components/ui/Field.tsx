import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon } from '../icons';
import { cx } from '../../lib/cx';
import styles from './Field.module.css';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Receives the ids to wire onto the control. */
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    required: boolean | undefined;
  }) => ReactNode;
  className?: string;
}

/**
 * Owns label / hint / error semantics for every form control, so no individual
 * input has to remember to wire aria-describedby and aria-invalid.
 */
export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {!required && <span className={styles.optional}>optional</span>}
      </div>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required: required || undefined,
      })}

      {hint && !error && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className={styles.error} id={errorId}>
          <Icon name="alert" size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(styles.control, className)} {...rest} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cx(styles.control, styles.textarea, className)} {...rest} />;
  },
);

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectInput({ className, children, ...rest }, ref) {
    return (
      <span className={styles.selectWrap}>
        <select ref={ref} className={cx(styles.control, styles.select, className)} {...rest}>
          {children}
        </select>
        <Icon name="chevronDown" size={16} className={styles.selectChevron} />
      </span>
    );
  },
);

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { children, className, ...rest },
  ref,
) {
  return (
    <label className={cx(styles.checkboxRow, className)}>
      <input ref={ref} type="checkbox" className={styles.checkbox} {...rest} />
      <span>{children}</span>
    </label>
  );
});
