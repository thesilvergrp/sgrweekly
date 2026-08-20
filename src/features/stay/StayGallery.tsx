import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { GalleryViewer } from './GalleryViewer';
import styles from './StayGallery.module.css';

interface StayGalleryProps {
  name: string;
  photos: string[];
}

const STRIP_LIMIT = 7;

/**
 * Lead image plus a scrollable filmstrip. Selecting any thumbnail promotes it
 * to the lead; the button and the final thumbnail both open the full viewer.
 */
export function StayGallery({ name, photos }: StayGalleryProps) {
  const [leadIndex, setLeadIndex] = useState(0);
  const [viewerAt, setViewerAt] = useState<number | null>(null);

  if (photos.length === 0) {
    return <p className={styles.empty}>Photography for this home is on its way.</p>;
  }

  const strip = photos.slice(0, STRIP_LIMIT);
  const remaining = photos.length - strip.length;

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.lead}>
          <img
            className={styles.leadImage}
            src={photos[leadIndex]}
            alt={`${name} — photo ${leadIndex + 1} of ${photos.length}`}
            loading="eager"
          />
          <Button
            className={styles.openButton}
            variant="quiet"
            size="sm"
            iconStart="photos"
            onClick={() => setViewerAt(leadIndex)}
          >
            All {photos.length} photos
          </Button>
        </div>

        {photos.length > 1 && (
          <div className={styles.filmstrip}>
            {strip.map((photo, index) => {
              const isLastWithMore = remaining > 0 && index === strip.length - 1;
              return (
                <button
                  key={photo}
                  type="button"
                  className={styles.thumb}
                  aria-current={index === leadIndex ? 'true' : undefined}
                  aria-label={
                    isLastWithMore
                      ? `See all ${photos.length} photos`
                      : `Show photo ${index + 1} of ${name}`
                  }
                  onClick={() => (isLastWithMore ? setViewerAt(index) : setLeadIndex(index))}
                >
                  <img className={styles.thumbImage} src={photo} alt="" loading="lazy" />
                  {isLastWithMore && <span className={styles.more}>+{remaining}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <GalleryViewer
        name={name}
        photos={photos}
        startIndex={viewerAt ?? 0}
        open={viewerAt !== null}
        onClose={() => setViewerAt(null)}
      />
    </>
  );
}
