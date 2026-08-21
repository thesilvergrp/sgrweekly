import { useSiteContent } from '../../app/content-context';
import { EditThis } from '../admin/EditAffordance';
import { StayFinder } from '../search/StayFinder';
import type { Stay } from '../../types/domain';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  /** The published catalog — the finder searches exactly what is on the site. */
  stays: Stay[];
  /** Same set, used for the photo mosaic. */
  featured: Stay[];
  onOpenStay: (stay: Stay) => void;
  onBrowse: () => void;
}

/**
 * Editorial hero: a type column beside a mosaic built from the collection's own
 * photography. No stock imagery, and nothing that depends on a network image
 * loading before the headline is readable.
 */
export function HeroSection({ stays, featured, onOpenStay, onBrowse }: HeroSectionProps) {
  const { hero } = useSiteContent();
  const mosaic = featured
    .map((stay) => ({ src: stay.photos[0], alt: `${stay.name}, ${stay.address.locality}` }))
    .filter((tile) => Boolean(tile.src))
    .slice(0, 3);

  const localities = new Set(stays.map((stay) => stay.address.locality));

  return (
    <section className={styles.hero} id="top">
      <div className={`u-container ${styles.layout}`}>
        <div>
          <p className={styles.overline}>
            <span className={styles.rule} aria-hidden="true" />
            {hero.overline}
            <EditThis panel="hero" />
          </p>

          <h1 className={styles.headline}>
            {hero.headline.lead}
            <span className={styles.emphasis}>{hero.headline.emphasis}</span>
            {hero.headline.tail}
          </h1>

          <p className={styles.lede}>{hero.lede}</p>

          <div className={styles.finder}>
            <StayFinder stays={stays} onOpen={onOpenStay} onBrowse={onBrowse} />
          </div>

          <dl className={styles.stats}>
            <div>
              <dt className="u-visually-hidden">Homes in the collection</dt>
              <dd>
                <span className={styles.statValue}>{stays.length}</span>
                <span className={styles.statLabel}>{hero.statLabels.homes}</span>
              </dd>
            </div>
            <div>
              <dt className="u-visually-hidden">Areas</dt>
              <dd>
                <span className={styles.statValue}>{localities.size}</span>
                <span className={styles.statLabel}>{hero.statLabels.areas}</span>
              </dd>
            </div>
            <div>
              <dt className="u-visually-hidden">Minimum stay</dt>
              <dd>
                <span className={styles.statValue}>7</span>
                <span className={styles.statLabel}>{hero.statLabels.minimumStay}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className={styles.mosaic} aria-hidden={mosaic.length === 0}>
          {mosaic[0] && (
            <figure className={`${styles.tile} ${styles.tileWide}`}>
              <img className={styles.image} src={mosaic[0].src} alt={mosaic[0].alt} loading="eager" />
            </figure>
          )}
          {mosaic[1] && (
            <figure className={styles.tile}>
              <img className={styles.image} src={mosaic[1].src} alt={mosaic[1].alt} loading="lazy" />
            </figure>
          )}
          {mosaic[2] && (
            <figure className={`${styles.tile} ${styles.tileOffset}`}>
              <img className={styles.image} src={mosaic[2].src} alt={mosaic[2].alt} loading="lazy" />
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
