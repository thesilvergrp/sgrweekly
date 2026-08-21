import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ToastProvider } from '../components/ui/Toast';
import { StayGrid } from '../features/catalog/StayGrid';
import { findStay, useStayCatalog } from '../features/catalog/useStayCatalog';
import { AboutSection } from '../features/home/AboutSection';
import { AmenitiesSection } from '../features/home/AmenitiesSection';
import { HeroSection } from '../features/home/HeroSection';
import { ContactSection } from '../features/contact/ContactSection';
import { AdminBar } from '../features/admin/EditAffordance';
import { StayPage } from '../features/stay/StayPage';
import { legacySectionAliases } from '../config/site';
import { scrollToSection, scrollToTop } from '../lib/scroll';
import type { Stay } from '../types/domain';
import { isAdminRoute } from '../lib/url';
import styles from './App.module.css';
import { AuthProvider } from './AuthProvider';
import { ContentProvider } from './ContentProvider';
import { useSiteContent } from './content-context';
import { useStayRoute } from './useStayRoute';

/**
 * The editor is a separate chunk fetched only when ?admin is requested, so a
 * normal visitor never downloads the admin UI or the auth flow.
 */
const AdminPage = lazy(() => import('../features/admin/AdminPage'));

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </ContentProvider>
    </AuthProvider>
  );
}

function Shell() {
  const catalog = useStayCatalog();
  const { slug, openStay, closeStay } = useStayRoute();
  const { meta } = useSiteContent();
  const [adminOpen, setAdminOpen] = useState(() => isAdminRoute());

  const selected = useMemo(() => findStay(catalog.stays, slug), [catalog.stays, slug]);
  // A deep link can name a stay that is not in the offline catalog yet; wait for
  // the live catalog before deciding it does not exist.
  const unresolved = Boolean(slug) && !selected && (catalog.isLoading || catalog.source === 'offline');

  const openStayView = useCallback(
    (stay: Stay) => {
      openStay(stay.slug || stay.id);
      scrollToTop(false);
    },
    [openStay],
  );

  const goToSection = useCallback(
    (sectionId: string) => {
      const target = legacySectionAliases[sectionId] ?? sectionId;
      if (slug) {
        closeStay();
        // Let the home view mount before scrolling to a section inside it.
        window.requestAnimationFrame(() => scrollToSection(target));
        return;
      }
      scrollToSection(target);
    },
    [slug, closeStay],
  );

  // Title and description follow the content document, so editing them takes
  // effect without a rebuild. NOTE: social/search crawlers read the STATIC tags
  // in index.html, which only a rebuild can change — see
  // docs/content-architecture.md.
  useEffect(() => {
    document.title = selected ? `${selected.name} — ${meta.title.split('—')[0].trim()}` : meta.title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', selected ? selected.summary : meta.description);
  }, [selected, meta]);

  if (adminOpen) {
    return (
      <Suspense fallback={<div className={`u-container ${styles.notFound}`}>Loading the editor…</div>}>
        <AdminPage
          stays={catalog.allStays}
          onExit={() => {
            setAdminOpen(false);
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className={styles.shell}>
      <SiteHeader onNavigate={goToSection} spyEnabled={!slug} />

      <main className={styles.main} id="main">
        {slug ? (
          selected ? (
            <StayPage stay={selected} onBack={closeStay} />
          ) : (
            <div className={`u-container ${styles.notFound}`}>
              <EmptyState
                icon={unresolved ? 'compass' : 'home'}
                title={unresolved ? 'Finding that home…' : 'We could not find that home'}
                actions={
                  <Button variant="secondary" onClick={closeStay}>
                    See every home
                  </Button>
                }
              >
                {unresolved
                  ? 'One moment while we load the current collection.'
                  : 'The link may be out of date, or the home may no longer be available. The full collection is a click away.'}
              </EmptyState>
            </div>
          )
        ) : (
          <>
            <HeroSection
              stays={catalog.stays}
              featured={catalog.stays}
              onOpenStay={openStayView}
              onBrowse={() => scrollToSection('stays')}
            />
            <StayGrid
              stays={catalog.stays}
              isLoading={catalog.isLoading}
              error={catalog.error}
              proxyReachable={catalog.proxyReachable}
              onRetry={catalog.reload}
              onOpen={openStayView}
            />
            <AmenitiesSection />
            <AboutSection />
            <ContactSection stays={catalog.stays} />
          </>
        )}
      </main>

      <SiteFooter onNavigate={goToSection} />
      <AdminBar />
    </div>
  );
}
