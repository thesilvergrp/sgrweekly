import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Notice';
import { Tag } from '../../components/ui/Tag';
import type { SiteContentDocument } from '../../content/site-content';
import type { Stay } from '../../types/domain';
import { cx } from '../../lib/cx';
import styles from './Admin.module.css';

type Patch = (patch: Partial<SiteContentDocument>) => void;
type Filter = 'all' | 'on' | 'off';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'on', label: 'On the site' },
  { id: 'off', label: 'Not on the site' },
];

/**
 * Chooses which properties the public site shows.
 *
 * The list is every active OwnerRez property, not just the published ones, so
 * this is where a property is added to the site as well as removed. Published
 * rows are visually marked rather than only tick-boxed: with twenty-odd
 * properties, "which of these are actually live" is the question being asked
 * every time this panel is opened, and it should be answerable at a glance.
 */
export function CurationPanel({
  featuredStayIds,
  stays,
  patch,
}: {
  featuredStayIds: string[];
  stays: Stay[];
  patch: Patch;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const published = useMemo(() => new Set(featuredStayIds), [featuredStayIds]);

  const setPublished = (id: string, on: boolean) =>
    patch({
      featuredStayIds: on
        ? [...featuredStayIds, id]
        : featuredStayIds.filter((current) => current !== id),
    });

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stays.filter((stay) => {
      const on = published.has(stay.id);
      if (filter === 'on' && !on) return false;
      if (filter === 'off' && on) return false;
      if (!needle) return true;
      return (
        stay.name.toLowerCase().includes(needle) ||
        stay.id.includes(needle) ||
        (stay.address.locality ?? '').toLowerCase().includes(needle)
      );
    });
  }, [stays, published, filter, query]);

  const onCount = stays.reduce((total, stay) => total + (published.has(stay.id) ? 1 : 0), 0);

  // Ids that are published but no longer exist in OwnerRez. Without this they
  // would be invisible here — the list is built from the catalog — while still
  // sitting in the document, so a property that was deleted upstream would look
  // published and never render.
  const orphans = useMemo(() => {
    const known = new Set(stays.map((stay) => stay.id));
    return featuredStayIds.filter((id) => !known.has(id));
  }, [featuredStayIds, stays]);

  return (
    <div className={styles.group}>
      <div className={styles.curationHead}>
        <p className={styles.groupTitle}>Homes published on the site</p>
        <Tag tone={onCount > 0 ? 'available' : 'muted'}>
          {onCount} of {stays.length} on the site
        </Tag>
      </div>

      <p className={styles.panelHint}>
        This is the whole of what the public site shows. A property that is not on the site is
        invisible — not in the grid, not in search, not reachable from a shared link, not on the
        map — even though it stays active in OwnerRez. Removing everything is ignored when the
        document is read, so the site can never end up with nothing on it.
      </p>

      <Notice tone="warning" title="Check the booking widget before adding one">
        A property must also be enabled on the OwnerRez booking widget. If it is not, the widget
        cannot select it and silently falls back to whichever property it lists first — so a guest
        would see the right home on the site and the wrong one on the payment form. Adding it here
        is only half the job.
      </Notice>

      {orphans.length > 0 && (
        <Notice tone="error" title="Published, but gone from OwnerRez">
          {orphans.join(', ')} {orphans.length === 1 ? 'is' : 'are'} in the published list but no
          longer in the OwnerRez catalog, so {orphans.length === 1 ? 'it renders' : 'they render'}{' '}
          nothing. Remove {orphans.length === 1 ? 'it' : 'them'} below.
          <div className={styles.curationOrphans}>
            {orphans.map((id) => (
              <Button key={id} variant="ghost" size="sm" onClick={() => setPublished(id, false)}>
                Remove {id}
              </Button>
            ))}
          </div>
        </Notice>
      )}

      <div className={styles.curationTools}>
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, id or area"
          aria-label="Search properties"
        />
        <div className={styles.curationFilters} role="group" aria-label="Filter properties">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.curationFilter}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.curationList}>
        {visible.map((stay) => {
          const on = published.has(stay.id);
          return (
            <div
              key={stay.id}
              className={cx(styles.curationRow, on && styles.curationRowOn)}
              data-published={on ? 'true' : undefined}
            >
              <div className={styles.curationRowText}>
                <span className={styles.curationRowName}>
                  {stay.name}
                  {on && <Tag tone="available">On the site</Tag>}
                </span>
                <span className={styles.stayPickMeta}>
                  {stay.address.locality} · id {stay.id} · {stay.capacity.bedrooms} bed ·{' '}
                  sleeps {stay.capacity.sleeps}
                </span>
              </div>
              <Button
                variant={on ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => setPublished(stay.id, !on)}
              >
                {on ? 'Remove' : 'Add'}
              </Button>
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className={styles.panelHint}>
            No properties match “{query}”{filter !== 'all' ? ' in this filter' : ''}.
          </p>
        )}
      </div>
    </div>
  );
}
