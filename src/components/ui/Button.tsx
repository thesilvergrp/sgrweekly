import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'quiet' | 'ghost' | 'link' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface ButtonProps
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {}

/**
 * The single button primitive. `loading` keeps the element's width, swaps the
 * label for a spinner and sets aria-busy so assistive tech is told what changed.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    block = false,
    iconStart,
    iconEnd,
    loading = false,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        styles.base,
        styles[variant],
        size !== 'md' && styles[size],
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="spinner" size={16} className={styles.spinner} />
      ) : (
        iconStart && <Icon name={iconStart} size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {!loading && iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
});

export interface LinkButtonProps
  extends CommonProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> {}

/** Anchor styled as a button — for real navigation (tel:, mailto:, external). */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { variant = 'secondary', size = 'md', block, iconStart, iconEnd, children, className, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      className={cx(
        styles.base,
        styles[variant],
        size !== 'md' && styles[size],
        block && styles.block,
        className,
      )}
      {...rest}
    >
      {iconStart && <Icon name={iconStart} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 14 : 16} />}
    </a>
  );
});
