import { useEffect, useState } from 'react';

/**
 * Reports which in-page section is currently in view, for the header's active
 * navigation state. Chooses the entry closest to the top of the viewport rather
 * than the last one to intersect, so fast scrolls cannot leave it wrong.
 */
export function useSectionSpy(ids: readonly string[], enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      setActive(null);
      return;
    }

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        setActive(best);
      },
      { threshold: [0.15, 0.4, 0.7], rootMargin: '-25% 0px -45% 0px' },
    );

    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [ids, enabled]);

  return active;
}
