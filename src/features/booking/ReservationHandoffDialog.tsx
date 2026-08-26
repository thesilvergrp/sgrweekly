import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import {
  OWNERREZ_WIDGET_ORIGIN,
  buildWidgetUrl,
  readCheckoutMessage,
  readHeightMessage,
} from '../../services/ownerrez-widget';
import styles from './ReservationHandoffDialog.module.css';

interface ReservationHandoffDialogProps {
  open: boolean;
  onClose: () => void;
  stayName: string;
  stayId: string;
  /** YYYY-MM-DD */
  arrival: string;
  /** YYYY-MM-DD */
  departure: string;
  guests: number;
  pets: number;
}

/**
 * Height used when the widget never reports one.
 *
 * Tall enough to clear the full booking form — dates, guests, quote, guest
 * details, discount code, card entry and the submit button — because a frame
 * that is too tall only costs some blank space at the bottom of a scrollable
 * modal, while one that is too short makes payment impossible.
 */
const FALLBACK_FRAME_HEIGHT = 1800;

/**
 * How long to wait for a height message before assuming none is coming.
 * Comfortably longer than the widget's own load, short enough that a guest
 * who scrolls immediately is not left looking at a clipped form.
 */
const HEIGHT_GRACE_MS = 2000;

/**
 * Hands the booking over to OwnerRez.
 *
 * PRESERVED INTEGRATION — see docs/api-inventory.md §4.5. The iframe is loaded
 * from a hand-built widget URL (never widget.js, which OwnerRez 403s on
 * unauthorised referrers). On submit the widget postMessages a checkout URL and
 * expects the PARENT to navigate the top window; without that the widget hangs
 * on "Redirecting to checkout…". The origin check is mandatory.
 *
 * Not loading widget.js also means nothing resizes the frame, and the widget
 * page does not scroll itself — so the frame is sized from the widget's own
 * height messages, with a tall fallback. The modal body scrolls, so a frame
 * taller than the viewport stays fully reachable either way.
 */
export function ReservationHandoffDialog({
  open,
  onClose,
  stayName,
  stayId,
  arrival,
  departure,
  guests,
  pets,
}: ReservationHandoffDialogProps) {
  const [frameHeight, setFrameHeight] = useState<number | null>(null);

  // A fresh open is a fresh measurement — a height left over from a previous
  // stay's form would otherwise clip or pad this one.
  useEffect(() => {
    if (open) setFrameHeight(null);
  }, [open, stayId]);

  useEffect(() => {
    if (!open) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== OWNERREZ_WIDGET_ORIGIN) return;

      const checkoutUrl = readCheckoutMessage(event.data);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      const height = readHeightMessage(event.data);
      // Only ever grow. The widget reports a short height mid-render as fields
      // are revealed, and shrinking to it would clip the form the guest is
      // already filling in.
      if (height !== null) setFrameHeight((current) => (current === null ? height : Math.max(current, height)));
    };

    window.addEventListener('message', onMessage);

    // If the widget never reports a height, fall back to one tall enough to
    // reach the payment button rather than leaving the form clipped.
    const timer = window.setTimeout(() => {
      setFrameHeight((current) => current ?? FALLBACK_FRAME_HEIGHT);
    }, HEIGHT_GRACE_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) return null;

  const src = buildWidgetUrl({ stayId, arrival, departure, guests, pets });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      flush
      title={`Book ${stayName}`}
      subtitle="Dates, guests and payment are handled securely by OwnerRez."
    >
      <iframe
        className={styles.frame}
        title={`Booking form for ${stayName}`}
        src={src}
        style={frameHeight ? { height: `${frameHeight}px` } : undefined}
      />
    </Modal>
  );
}
