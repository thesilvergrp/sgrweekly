const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION).matches ?? false;
}

/** Scrolls a section into view, allowing for the sticky header height. */
export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';

  if (!target || id === 'top') {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const headerHeight = readHeaderHeight();
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
  window.scrollTo({ top: Math.max(top, 0), behavior });
}

export function scrollToTop(smooth = true): void {
  window.scrollTo({ top: 0, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
}

function readHeaderHeight(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 64;
  return raw.includes('rem') ? parsed * 16 : parsed;
}
