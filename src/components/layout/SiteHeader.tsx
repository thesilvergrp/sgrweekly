import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrandMark } from '../brand/BrandMark';
import { Icon } from '../icons';
import { Button, LinkButton } from '../ui/Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useOnEscape } from '../../hooks/useOnEscape';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useSectionSpy } from '../../hooks/useSectionSpy';
import { useSiteContent } from '../../app/content-context';
import { sections } from '../../config/site';
import { cx } from '../../lib/cx';
import styles from './SiteHeader.module.css';

interface SiteHeaderProps {
  /** Navigate to an in-page section (returning home first if needed). */
  onNavigate: (sectionId: string) => void;
  /** Section spy is disabled while a stay detail view is open. */
  spyEnabled: boolean;
}

const SECTION_IDS = sections.map((section) => section.id);

export function SiteHeader({ onNavigate, spyEnabled }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeSection = useSectionSpy(SECTION_IDS, spyEnabled);
  const { business } = useSiteContent();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = useCallback(
    (sectionId: string) => {
      setDrawerOpen(false);
      onNavigate(sectionId);
    },
    [onNavigate],
  );

  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>

      <header className={cx(styles.header, scrolled && styles.scrolled)}>
        <div className={cx('u-container', styles.inner)}>
          <button type="button" onClick={() => go('top')} aria-label={`${business.name} — home`}>
            <BrandMark />
          </button>

          <nav className={styles.nav} aria-label="Sections">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={styles.navLink}
                aria-current={activeSection === section.id ? 'true' : undefined}
                onClick={() => go(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div className={styles.actions}>
            <LinkButton
              className={styles.phone}
              href={business.phoneHref}
              variant="quiet"
              size="sm"
              iconStart="phone"
            >
              {business.phone}
            </LinkButton>
            <Button variant="primary" size="sm" onClick={() => go('stays')}>
              Find a stay
            </Button>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
            >
              <Icon name="menu" size={18} />
              Menu
            </button>
          </div>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onNavigate={go} />
    </>
  );
}

function NavDrawer({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { business } = useSiteContent();
  useOnEscape(open, onClose);
  useScrollLock(open);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return createPortal(
    <div className={styles.drawerRoot}>
      <div className={styles.drawerScrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={styles.drawer}
      >
        <div className={styles.drawerHead}>
          <BrandMark />
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Sections">
          {sections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={styles.drawerLink}
              onClick={() => onNavigate(section.id)}
            >
              <span className={styles.drawerIndex}>{String(index + 1).padStart(2, '0')}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className={styles.drawerFoot}>
          <a className={styles.drawerContact} href={business.phoneHref}>
            <Icon name="phone" size={16} />
            {business.phone}
          </a>
          <a className={styles.drawerContact} href={`mailto:${business.email}`}>
            <Icon name="mail" size={16} />
            {business.email}
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}
