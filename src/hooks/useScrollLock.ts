import { useEffect } from 'react';

let lockCount = 0;

/**
 * Prevents the page behind an overlay from scrolling. Reference-counted so
 * nested overlays (gallery → lightbox) cannot unlock the page early.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    if (lockCount === 0) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      body.style.setProperty('padding-right', `${scrollbar}px`);
      body.classList.add('u-scroll-locked');
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.classList.remove('u-scroll-locked');
        body.style.removeProperty('padding-right');
      }
    };
  }, [active]);
}
