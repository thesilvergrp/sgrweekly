import { Icon } from '../../components/icons';
import { useAuth } from '../../app/auth-context';
import { editorHref } from './editor-link';
import styles from './EditAffordance.module.css';

/**
 * In-page editing affordances, rendered ONLY for a signed-in admin.
 *
 * A visitor never sees these — and never downloads the editor either, since it
 * stays a lazily loaded chunk. These are plain anchors rather than in-app
 * navigation on purpose: entering the editor is a mode switch, and a real
 * navigation keeps the two states cleanly separated.
 */

/**
 * Small "Edit" chip beside a section heading, so the way to change wording is
 * visible where the wording is, rather than only in a separate screen.
 */
export function EditThis({ panel, label = 'Edit' }: { panel: string; label?: string }) {
  const { session } = useAuth();
  if (!session) return null;

  return (
    <a className={styles.edit} href={editorHref(panel)}>
      <Icon name="key" size={12} />
      {label}
    </a>
  );
}

/** Persistent bar telling an admin they are signed in, with a way into the editor. */
export function AdminBar() {
  const { session, signOut } = useAuth();
  if (!session) return null;

  return (
    <div className={styles.bar} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>Signed in as {session.email ?? 'admin'}</span>
      <a className={styles.barLink} href={editorHref('hero')}>
        <Icon name="sparkle" size={13} />
        Edit site
      </a>
      <button type="button" className={`${styles.barLink} ${styles.barGhost}`} onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
