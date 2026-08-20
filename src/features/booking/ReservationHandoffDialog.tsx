import { useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import {
  OWNERREZ_WIDGET_ORIGIN,
  buildWidgetUrl,
  readCheckoutMessage,
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
 * Hands the booking over to OwnerRez.
 *
 * PRESERVED INTEGRATION — see docs/api-inventory.md §4.5. The iframe is loaded
 * from a hand-built widget URL (never widget.js, which OwnerRez 403s on
 * unauthorised referrers). On submit the widget postMessages a checkout URL and
 * expects the PARENT to navigate the top window; without that the widget hangs
 * on "Redirecting to checkout…". The origin check is mandatory.
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
  useEffect(() => {
    if (!open) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== OWNERREZ_WIDGET_ORIGIN) return;
      const checkoutUrl = readCheckoutMessage(event.data);
      if (checkoutUrl) window.location.href = checkoutUrl;
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
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
      <iframe className={styles.frame} title={`Booking form for ${stayName}`} src={src} />
    </Modal>
  );
}
