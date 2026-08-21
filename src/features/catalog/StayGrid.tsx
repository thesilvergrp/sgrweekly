import { useSiteContent } from '../../app/content-context';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Notice } from '../../components/ui/Notice';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Skeleton } from '../../components/ui/Skeleton';
import { describeError } from '../../lib/errors';
import type { Stay } from '../../types/domain';
import { StayCard } from './StayCard';
import styles from './StayGrid.module.css';

interface StayGridProps {
  stays: Stay[];
  isLoading: boolean;
  error: unknown;
  proxyReachable: boolean | null;
  onRetry: () => void;
  onOpen: (stay: Stay) => void;
}

/**
 * The curated grid. Covers all four states explicitly: loading, error (with the
 * offline catalog still readable underneath), empty and populated.
 */
export function StayGrid({
  stays,
  isLoading,
  error,
  proxyReachable,
  onRetry,
  onOpen,
}: StayGridProps) {
  const { collection } = useSiteContent();
  const friendly = error ? describeError(error) : null;

  return (
    <section className={styles.section} id="stays" aria-labelledby="stays-title">
      <div className="u-container">
        <SectionHeading
          index={collection.index}
          overline={collection.overline}
          title={collection.title}
          lede={collection.lede}
          id="stays-title"
        />

        {friendly && (
          <Notice
            className={styles.notice}
            tone="warning"
            title={
              proxyReachable === false
                ? 'Live availability is offline right now'
                : friendly.title
            }
            detail={friendly.detail}
            actions={
              friendly.canRetry ? (
                <Button variant="quiet" size="sm" iconStart="arrowRight" onClick={onRetry}>
                  Try again
                </Button>
              ) : undefined
            }
          >
            You are seeing our saved property details. Prices and calendars may not be current —
            call us and we will confirm anything you need.
          </Notice>
        )}

        {isLoading && stays.length === 0 ? (
          <LoadingGrid />
        ) : stays.length === 0 ? (
          <EmptyState
            className={styles.notice}
            icon="home"
            title="No homes to show just yet"
            actions={
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Reload
              </Button>
            }
          >
            Our calendar is being updated. Give us a call and we will find you something.
          </EmptyState>
        ) : (
          <ul className={styles.grid}>
            {stays.map((stay, index) => (
              <li key={stay.id}>
                <StayCard stay={stay} index={index} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        )}

      </div>
    </section>
  );
}

function LoadingGrid() {
  return (
    <ul className={styles.grid} aria-busy="true" aria-label="Loading homes">
      {[0, 1, 2].map((key) => (
        <li key={key}>
          <div className={styles.skeletonCard}>
            <Skeleton height="0px" style={{ aspectRatio: '4 / 3', height: 'auto', width: '100%' }} />
            <div className={styles.skeletonBody}>
              <Skeleton text width="35%" />
              <Skeleton text width="70%" height="1.4em" />
              <Skeleton text width="90%" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
