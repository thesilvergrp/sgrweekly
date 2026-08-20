import { Icon } from '../../components/icons';
import { Tag } from '../../components/ui/Tag';
import type { Stay } from '../../types/domain';
import { describeBedrooms, pluralise } from '../../lib/format';
import { relativeStayUrl } from '../../lib/url';
import styles from './StayCard.module.css';

interface StayCardProps {
  stay: Stay;
  index: number;
  onOpen: (stay: Stay) => void;
}

/**
 * Catalog card. The name is a real anchor to `/?property=<slug>` so the link can
 * be copied, opened in a new tab and read by assistive tech as a link — the
 * click handler only intercepts plain left clicks for in-app navigation.
 */
export function StayCard({ stay, index, onOpen }: StayCardProps) {
  const cover = stay.photos[0];

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {cover ? (
          <img
            className={styles.image}
            src={cover}
            alt={`${stay.name} in ${stay.address.locality}`}
            loading={index < 3 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : null}
        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
        {stay.spotlight && (
          <span className={styles.badge}>
            <Tag tone="accent">Guest favourite</Tag>
          </span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.locality}>
          <Icon name="pin" size={13} />
          {stay.address.locality}
        </p>

        <h3 className={styles.name}>
          <a
            className={styles.link}
            href={relativeStayUrl(stay.slug)}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              onOpen(stay);
            }}
          >
            {stay.name}
          </a>
        </h3>

        <p className={styles.summary}>{stay.summary}</p>

        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <Icon name="bed" size={14} />
            <dt className="u-visually-hidden">Bedrooms</dt>
            <dd>{describeBedrooms(stay.capacity.bedrooms)}</dd>
          </div>
          <div className={styles.metaItem}>
            <Icon name="bath" size={14} />
            <dt className="u-visually-hidden">Bathrooms</dt>
            <dd>{pluralise(stay.capacity.bathrooms, 'bath')}</dd>
          </div>
          <div className={styles.metaItem}>
            <Icon name="users" size={14} />
            <dt className="u-visually-hidden">Sleeps</dt>
            <dd>Sleeps {stay.capacity.sleeps}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
