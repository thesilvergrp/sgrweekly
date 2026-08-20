import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/icons';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useOnEscape } from '../../hooks/useOnEscape';
import { useScrollLock } from '../../hooks/useScrollLock';
import styles from './GalleryViewer.module.css';

interface GalleryViewerProps {
  name: string;
  photos: string[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}

/** Full-screen photo viewer: arrow keys, a counter, and a thumbnail rail. */
export function GalleryViewer({ name, photos, startIndex, open, onClose }: GalleryViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => Math.min(photos.length - 1, Math.max(0, current + delta)));
    },
    [photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, go]);

  useOnEscape(open, onClose);
  useScrollLock(open);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photo gallery`}
    >
      <div className={styles.bar}>
        <span className={styles.title}>{name}</span>
        <span className={styles.counter} aria-live="polite">
          {index + 1} / {photos.length}
        </span>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close gallery">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className={styles.stage}>
        <img
          className={styles.image}
          src={photos[index]}
          alt={`${name} — photo ${index + 1} of ${photos.length}`}
        />
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous photo"
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => go(1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
      </div>

      <div className={styles.rail}>
        {photos.map((photo, position) => (
          <button
            key={photo}
            type="button"
            className={styles.railThumb}
            aria-current={position === index ? 'true' : undefined}
            aria-label={`Photo ${position + 1}`}
            onClick={() => setIndex(position)}
          >
            <img className={styles.railImage} src={photo} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
