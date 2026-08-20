import { glyphs, type IconName } from './glyphs';

export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(glyphs, value);
}

/**
 * Resolves an icon name that came from the editable content document.
 * Content is authored by hand, so an unknown or misspelled name must degrade to
 * a sensible glyph rather than rendering an empty box.
 */
export function toIconName(value: unknown, fallback: IconName): IconName {
  return isIconName(value) ? value : fallback;
}
