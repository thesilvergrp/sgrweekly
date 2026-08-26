import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { Tag } from '../../components/ui/Tag';
import { useAuth } from '../../app/auth-context';
import { useContentControls, useSiteContent, useStaysContent } from '../../app/content-context';
import type { SiteContentDocument } from '../../content/site-content';
import type { StaysContentDocument } from '../../content/stays-document';
import { describeError } from '../../lib/errors';
import {
  fetchAllStaysContent,
  saveSiteContent,
  saveStaysContent,
} from '../../services/content.service';
import type { Stay } from '../../types/domain';
import {
  AboutPanel,
  AmenitiesPanel,
  BusinessPanel,
  CollectionPanel,
  ContactPanel,
  FooterPanel,
  HeroPanel,
  MetaPanel,
  StayTermsPanel,
} from './SiteCopyPanels';
import { CurationPanel } from './CurationPanel';
import { StaysPanel } from './StaysPanel';
import styles from './Admin.module.css';

type PanelId =
  | 'meta'
  | 'business'
  | 'hero'
  | 'collection'
  | 'amenities'
  | 'about'
  | 'contact'
  | 'footer'
  | 'curation'
  | 'stays'
  | 'terms';

const PANELS: { id: PanelId; label: string; hint: string }[] = [
  { id: 'hero', label: 'Hero', hint: 'The first thing anyone reads.' },
  { id: 'collection', label: 'Collection', hint: 'The heading above the grid of homes.' },
  { id: 'amenities', label: 'What you get', hint: 'The four feature cards.' },
  { id: 'about', label: 'About', hint: 'Who you are, in your words.' },
  { id: 'contact', label: 'Contact', hint: 'The enquiry section.' },
  { id: 'footer', label: 'Footer', hint: 'Blurb and column headings.' },
  { id: 'curation', label: 'Published homes', hint: 'Which properties the site shows at all.' },
  { id: 'terms', label: 'Stay terms', hint: 'Check-in times, cancellation, pets.' },
  { id: 'stays', label: 'Property text', hint: 'Descriptions, amenities and photos. Includes unpublished properties, so you can write copy before putting one live.' },
  { id: 'business', label: 'Business details', hint: 'Phone, email, areas — used across the site.' },
  { id: 'meta', label: 'Page title', hint: 'Browser tab and description.' },
];

interface AdminPageProps {
  stays: Stay[];
  onExit: () => void;
}

/**
 * The content editor.
 *
 * Loaded lazily, so a normal visitor never downloads any of it. Edits are held
 * as a local draft and published explicitly — nothing is written on keystroke,
 * because every publish is a live change to the public site.
 */
export default function AdminPage({ stays, onExit }: AdminPageProps) {
  const auth = useAuth();
  const publishedSite = useSiteContent();
  const publishedStays = useStaysContent();
  const { sources, refresh } = useContentControls();

  // Honour ?panel= so the in-page "Edit" chips land on the right section
  // instead of dropping the editor at the top every time.
  const [panel, setPanel] = useState<PanelId>(() => {
    const requested = new URLSearchParams(window.location.search).get('panel');
    return PANELS.some((item) => item.id === requested) ? (requested as PanelId) : 'hero';
  });
  const [siteDraft, setSiteDraft] = useState<SiteContentDocument>(publishedSite);
  // Seeded from the ADMIN read, which includes unpublished properties. The
  // context copy is the trimmed public one; publishing from that would erase
  // every unpublished property's copy, so the editor waits for the full
  // document before it will let the stays document be published.
  const [staysDraft, setStaysDraft] = useState<StaysContentDocument>(publishedStays);
  const [staysBase, setStaysBase] = useState<StaysContentDocument | null>(null);
  const [staysLoadError, setStaysLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const token = auth.session ? auth.getToken() : null;

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchAllStaysContent(token)
      .then((full) => {
        if (!active) return;
        setStaysBase(full);
        setStaysDraft(full);
        setStaysLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setStaysLoadError(error);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const siteDirty = useMemo(
    () => JSON.stringify(siteDraft) !== JSON.stringify(publishedSite),
    [siteDraft, publishedSite],
  );
  const staysDirty = useMemo(
    () => staysBase !== null && JSON.stringify(staysDraft) !== JSON.stringify(staysBase),
    [staysDraft, staysBase],
  );
  const dirty = siteDirty || staysDirty;

  const patchSite = useCallback(
    (patch: Partial<SiteContentDocument>) => setSiteDraft((current) => ({ ...current, ...patch })),
    [],
  );

  const publish = async () => {
    const token = auth.getToken();
    if (!token) {
      setSaveError(new Error('Your session expired. Sign in again to publish.'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Only what changed is written, so publishing a heading tweak does not
      // rewrite the much larger property document.
      if (siteDirty) await saveSiteContent(siteDraft, token);
      if (staysDirty) {
        await saveStaysContent(staysDraft, token);
        setStaysBase(staysDraft);
      }
      setSavedAt(new Date().toLocaleTimeString());
      refresh();
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setSiteDraft(publishedSite);
    setStaysDraft(staysBase ?? publishedStays);
    setSaveError(null);
  };

  if (!auth.isConfigured) return <NotConfigured onExit={onExit} />;
  if (auth.isResolving) return <Centered>Signing you in…</Centered>;
  if (!auth.session) return <SignIn onExit={onExit} />;

  const active = PANELS.find((item) => item.id === panel) ?? PANELS[0];
  const friendly = saveError ? describeError(saveError) : null;

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <h1 className={styles.barTitle}>
          Content editor
          <span className={styles.barMeta}>
            Signed in as {auth.session.email ?? 'admin'} · page copy {sources.site} · property text{' '}
            {sources.stays}
          </span>
        </h1>

        <div className={styles.barActions}>
          {dirty && (
            <span className={styles.dirty}>
              <Icon name="alert" size={14} />
              Unpublished changes
            </span>
          )}
          {!dirty && savedAt && <Tag tone="available">Published {savedAt}</Tag>}
          <Button variant="ghost" size="sm" onClick={discard} disabled={!dirty || saving}>
            Discard
          </Button>
          <Button size="sm" onClick={publish} loading={saving} disabled={!dirty}>
            Publish
          </Button>
          <Button variant="quiet" size="sm" onClick={onExit}>
            View site
          </Button>
          <Button variant="ghost" size="sm" onClick={auth.signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Content sections">
          {PANELS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.navItem}
              aria-current={item.id === panel ? 'true' : undefined}
              onClick={() => setPanel(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{active.label}</h2>
            <p className={styles.panelHint}>{active.hint}</p>
          </div>

          {friendly && (
            <Notice tone="error" title={friendly.title} detail={friendly.detail}>
              {friendly.body}
            </Notice>
          )}

          {import.meta.env.DEV && auth.session?.idToken === 'dev-no-auth' && (
            <Notice tone="info" title="Local development — no sign-in">
              You are editing through the dev server, which writes to ./.content and checks nothing.
              The deployed editor requires a Cognito sign-in and the Lambda verifies it on every save.
            </Notice>
          )}

          {sources.site === 'bundled' && (
            <Notice tone="warning" title="No published document yet">
              You are editing the copy built into the site. Publishing writes the first document to
              the content store; nothing is lost either way, because the built-in copy always stays
              as the fallback.
            </Notice>
          )}

          {panel === 'meta' && <MetaPanel value={siteDraft.meta} patch={patchSite} />}
          {panel === 'business' && <BusinessPanel value={siteDraft.business} patch={patchSite} />}
          {panel === 'hero' && <HeroPanel value={siteDraft.hero} patch={patchSite} />}
          {panel === 'collection' && <CollectionPanel value={siteDraft.collection} patch={patchSite} />}
          {panel === 'amenities' && <AmenitiesPanel value={siteDraft.amenities} patch={patchSite} />}
          {panel === 'about' && <AboutPanel value={siteDraft.about} patch={patchSite} />}
          {panel === 'contact' && <ContactPanel value={siteDraft.contact} patch={patchSite} />}
          {panel === 'footer' && <FooterPanel value={siteDraft.footer} patch={patchSite} />}
          {panel === 'terms' && <StayTermsPanel value={siteDraft.stayDefaults} patch={patchSite} />}
          {panel === 'curation' && (
            <CurationPanel featuredStayIds={siteDraft.featuredStayIds} stays={stays} patch={patchSite} />
          )}
          {panel === 'stays' &&
            (staysLoadError ? (
              <Notice
                tone="error"
                title="Could not load the property text"
                detail={describeError(staysLoadError).detail}
              >
                Editing is disabled for this section until it loads, so a publish cannot overwrite
                copy that was never read. Reload the page to try again.
              </Notice>
            ) : staysBase === null ? (
              <Notice tone="info" title="Loading property text…">
                Fetching the full set, including properties that are not published yet.
              </Notice>
            ) : (
              <StaysPanel document={staysDraft} stays={stays} onChange={setStaysDraft} />
            ))}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.centered}>{children}</div>
    </div>
  );
}

function SignIn({ onExit }: { onExit: () => void }) {
  const auth = useAuth();
  return (
    <div className={styles.shell}>
      <div className={styles.centered}>
        <div className={styles.signIn}>
          <h1 className={styles.panelTitle}>Content editor</h1>
          <p className={styles.panelHint}>
            Sign in to change the wording on the site. Editing is limited to the accounts we have
            set up.
          </p>
          {auth.error && (
            <Notice tone="error" title="That sign-in did not complete">
              {auth.error}
            </Notice>
          )}
          <Button size="lg" iconStart="key" onClick={auth.signIn}>
            Sign in
          </Button>
          <Button variant="link" onClick={onExit}>
            Back to the site
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotConfigured({ onExit }: { onExit: () => void }) {
  return (
    <div className={styles.shell}>
      <div className={styles.centered}>
        <div className={styles.signIn}>
          <h1 className={styles.panelTitle}>Editing is not set up here</h1>
          <p className={styles.panelHint}>
            This build has no sign-in configuration, so the editor cannot run. Set
            <span className={styles.mono}> VITE_COGNITO_DOMAIN </span> and
            <span className={styles.mono}> VITE_COGNITO_CLIENT_ID </span>
            on the environment that should offer editing — see docs/content-architecture.md.
          </p>
          <Button variant="secondary" onClick={onExit}>
            Back to the site
          </Button>
        </div>
      </div>
    </div>
  );
}
