import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Property } from '../lib/types';

// OwnerRez "All Properties" Booking/Inquiry widget id.
const OWNERREZ_WIDGET_ID = 'a607f72c561749baa59066d916909564';

interface OwnerRezWidgetModalProps {
  property: Property;
  arrival: string;    // YYYY-MM-DD
  departure: string;  // YYYY-MM-DD
  adults: number;
  pets?: number;
  onClose: () => void;
}

// The OwnerRez widget reads these query params to prefill the booking form.
// We embed this clean URL directly in an iframe (rather than via widget.js,
// which appends a `referrer` param that OwnerRez 403s on unauthorized domains).
// or_propertyId selects the property — NOT propertyKey, which is a separate GUID.
function buildWidgetUrl({ property, arrival, departure, adults, pets }: OwnerRezWidgetModalProps): string {
  const params = new URLSearchParams();
  params.set('or_propertyId', String(property.id));
  params.set('or_arrival', arrival);
  params.set('or_departure', departure);
  params.set('or_guests', String(adults));
  params.set('or_adults', String(adults));
  if (pets && pets > 0) params.set('or_pets', String(pets));
  return `https://app.ownerrez.com/widgets/${OWNERREZ_WIDGET_ID}?${params.toString()}`;
}

export default function OwnerRezWidgetModal(props: OwnerRezWidgetModalProps) {
  const { property, onClose } = props;
  const src = buildWidgetUrl(props);

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // When the guest hits "Book Now"/"Send Inquiry", the OwnerRez iframe doesn't
  // navigate itself — it postMessages the checkout URL to the parent and expects
  // the parent to redirect the top window (normally widget.js's job). Since we
  // embed the iframe directly, we perform that navigation here; without it the
  // widget hangs on "Redirecting to checkout…".
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://app.ownerrez.com') return;
      let data = e.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (data && typeof data === 'object' && typeof data.url === 'string') {
        window.location.href = data.url; // OwnerRez secure checkout / confirmation
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white border border-silver-700/50 rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden shadow-2xl scale-in">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-silver-700/40 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-display text-lg font-semibold text-silver-50">Book {property.name}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-silver-400 hover:text-silver-200 hover:bg-silver-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* OwnerRez booking widget, prefilled via the URL params */}
        <iframe
          title="OwnerRez booking"
          src={src}
          className="flex-1 w-full border-0"
        />
      </div>
    </div>
  );
}
