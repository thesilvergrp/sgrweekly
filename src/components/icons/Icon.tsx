import type { SVGProps } from 'react';
import { glyphs, type IconName } from './glyphs';

export type { IconName };

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Pixel size of the square viewport. Defaults to 20. */
  size?: number;
  /** Supplying a title makes the icon exposed to assistive tech. */
  title?: string;
}

/**
 * The project's own icon set: a 24×24 grid, 1.5px strokes, round joins, drawn
 * for this design system. No icon library is bundled.
 *
 * Icons are decorative by default (`aria-hidden`); pass `title` when an icon is
 * the only label for a control.
 */
export function Icon({ name, size = 20, title, ...rest }: IconProps) {
  const glyph = glyphs[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
