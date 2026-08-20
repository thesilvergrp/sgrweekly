import { useState, useEffect } from 'react';
import {
  ArrowLeft, Share, Image as ImageIcon, X,
  Waves, Wifi, Car, Wind, Flame, Utensils, Tv, Gamepad2,
  Home, Coffee, Wine, TreePine, Shield, Bath,
  ParkingSquare, Refrigerator, Baby, ShowerHead, Droplets,
  Trees, Armchair, DoorOpen, Laptop, UtensilsCrossed, Warehouse,
  CheckCircle2, XCircle, Users, Clock,
} from 'lucide-react';
import type { Property } from '../lib/types';
import { fetchAllBookings } from '../lib/api';
import { buildUnavailableIntervals, type UnavailableInterval } from '../lib/availability';
import { getThingsToKnow, MAX_PETS, type Rule } from '../lib/things-to-know';
import OwnerRezWidgetModal from './OwnerRezWidgetModal';
import BookingCalendar from './BookingCalendar';

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
}

const amenityIcons: Record<string, typeof Waves> = {
  'Heated Pool & Spa': Waves, 'Pool & Hot Tub': Waves, 'Private Pool': Waves, 'Shared Pool': Waves, 'Poolside Cinema': Tv,
  'High-Speed Wi-Fi': Wifi, 'Free Parking': Car, 'Covered Parking': Car, 'EV Charger': Car,
  'Outdoor Living': TreePine, 'Outdoor Lounge': TreePine, 'Outdoor Dining': Utensils, 'Outdoor Kitchen': Utensils,
  'Indoor Fireplace': Flame, 'Fire Pit': Flame, 'Outdoor Grill & Bar': Flame,
  "Chef's Kitchen": Utensils, 'Full Kitchen': Utensils, 'Modern Kitchen': Utensils, 'Kitchenette': Coffee,
  'Smart TVs': Tv, 'Smart TV': Tv,
  'Full Arcade': Gamepad2, 'Free Arcade': Gamepad2,
  'Wine Cellar': Wine, 'Private Yard': TreePine, 'Private Garage': Car,
  'Air Conditioning': Wind, 'Designer Interior': Home, 'Modern Interior': Home,
  'En-Suite Baths': Bath, 'Workspace': Home,
  'Covered Patio with Fireplace & TV': Flame,
  // Verbatim OwnerRez amenity vocabulary (the live data on each property).
  'Hot tub': Waves,
  'Free parking': ParkingSquare,
  'Fridge': Refrigerator,
  'Wifi': Wifi,
  'Bath linens': Bath,
  'Hair dryer': Wind,
  'TV': Tv,
  'Game console': Gamepad2,
  'Crib': Baby,
  'Shower': ShowerHead,
  'Toilet': Droplets,
  'Bathtub': Bath,
  'Fire place': Flame,
  'Patio': Armchair,
  'Dedicated workspace': Laptop,
  'Dining table': UtensilsCrossed,
  'Garage': Warehouse,
  'Garden': Trees,
  'Balcony': DoorOpen,
};

export default function PropertyDetail({ property, onBack }: PropertyDetailProps) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [pets, setPets] = useState(0);
  const thingsToKnow = getThingsToKnow(property);
  const [showBooking, setShowBooking] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unavailable, setUnavailable] = useState<UnavailableInterval[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Pull every booking + owner block for this property and merge all pages
  // before exposing availability to the calendar (STEP 4). On failure we fall
  // back to "all open" rather than blocking the whole calendar.
  useEffect(() => {
    let cancelled = false;
    setLoadingAvailability(true);
    setCheckIn(null);
    setCheckOut(null);
    setPets(0);
    fetchAllBookings(property.id)
      .then((bookings) => {
        if (cancelled) return;
        setUnavailable(buildUnavailableIntervals(bookings));
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[availability] could not load bookings; showing all dates as available:', err);
        setUnavailable([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [property.id]);

  const images = property.images.length > 0
    ? property.images
    : ['https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1600'];

  // 1-large + up to 4-small header collage — each tile a distinct photo (no
  // repeats). The full set lives in the "View all photos" gallery.
  const heroImg = images[0];
  const gridImgs = images.slice(1, 5);

  // While the gallery is open, lock background scroll and close on Escape.
  useEffect(() => {
    if (!showAllPhotos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAllPhotos(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showAllPhotos]);

  // Close the property-rules modal on Escape.
  useEffect(() => {
    if (!showRules) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRules(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showRules]);

  const handleBookClick = () => {
    if (!checkIn || !checkOut) return;
    setShowBooking(true);
  };

  // Share this property via the native share sheet (Web Share API), falling
  // back to copying the link. The link is a ?property=<slug> deep link that the
  // app opens on load (App.tsx), so it works without server rewrite rules.
  const handleShare = async () => {
    const url = `${window.location.origin}/?property=${property.slug || property.id}`;
    const shareData = {
      title: property.name,
      text: `Check out ${property.name} on Silver Group Rentals`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // Swallow the user-cancelled share (AbortError); surface anything else.
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('[share] failed; copying link instead:', err);
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable — nothing more we can do */
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-20 lg:top-24 z-30 bg-white/95 backdrop-blur-xl border-b border-silver-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-silver-200 hover:text-accent-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            All Properties
          </button>
          <div className="hidden sm:flex items-center gap-2 text-silver-300 text-sm">
            <span className="text-silver-50 font-semibold">{property.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Photo grid — 1 large left, 2x2 small right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 rounded-2xl overflow-hidden mb-8 h-[460px] sm:h-[520px] lg:h-[560px]">
          <div className="relative h-full">
            <img
              src={heroImg}
              alt={`${property.name} primary photo`}
              className="w-full h-full object-cover rounded-2xl lg:rounded-r-none"
            />
            {/* Mobile: the grid is hidden, so surface the gallery here too */}
            <button
              type="button"
              onClick={() => setShowAllPhotos(true)}
              className="lg:hidden absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-md text-silver-50 text-xs font-medium hover:bg-silver-100 transition-colors"
            >
              <ImageIcon size={13} />
              View all {images.length} photos
            </button>
          </div>
          <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {gridImgs.map((src, i) => (
              <div key={i} className="relative overflow-hidden">
                <img
                  src={src}
                  alt={`${property.name} photo ${i + 2}`}
                  className={`w-full h-full object-cover ${
                    i === 1 ? 'rounded-tr-2xl' : i === gridImgs.length - 1 ? 'rounded-br-2xl' : ''
                  }`}
                />
                {i === gridImgs.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-md text-silver-50 text-xs font-medium hover:bg-silver-100 transition-colors"
                  >
                    <ImageIcon size={13} />
                    View all {images.length} photos
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Title block */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-silver-300 text-sm">{property.location}</div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-silver-50 mt-1">
                    {property.name}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-silver-200 text-sm flex-wrap">
                    <span>{property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} ${property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`}</span>
                    <span className="text-silver-400">·</span>
                    <span>{property.beds} {property.beds === 1 ? 'bed' : 'beds'}</span>
                    <span className="text-silver-400">·</span>
                    <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
                    <span className="text-silver-400">·</span>
                    <span>{property.max_guests} guests</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="shrink-0 w-10 h-10 rounded-full border border-silver-700 hover:border-silver-300 flex items-center justify-center text-silver-100 hover:text-silver-50 transition-colors"
                  aria-label="Share"
                >
                  <Share size={16} />
                </button>
              </div>
            </div>

            <hr className="border-silver-700" />

            {/* About */}
            <div>
              <h2 className="font-display text-2xl font-bold text-silver-50 mb-3">About the property</h2>
              <p className="text-silver-100 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            <hr className="border-silver-700" />

            {/* Amenities */}
            <div>
              <h2 className="font-display text-2xl font-bold text-silver-50 mb-4">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {property.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Shield;
                  return (
                    <div key={amenity} className="flex items-center gap-3 py-2">
                      <Icon size={20} className="text-silver-100 shrink-0" />
                      <span className="text-silver-100 text-sm">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-silver-700" />

            {/* Things to know */}
            <div>
              <h2 className="font-display text-2xl font-bold text-silver-50 mb-4">Things to know</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-silver-50 font-semibold text-sm mb-2">Cancellation policy</h3>
                  <p className="text-silver-300 text-sm leading-relaxed">{thingsToKnow.cancellationPolicy}</p>
                </div>
                <div>
                  <h3 className="text-silver-50 font-semibold text-sm mb-2">Property rules</h3>
                  <ul className="space-y-2">
                    {thingsToKnow.rulesPreview.map((rule) => (
                      <li key={rule.label} className="flex items-center gap-2 text-silver-300 text-sm">
                        <RuleIcon tone={rule.tone} />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowRules(true)}
                    className="mt-3 text-silver-100 text-sm font-medium underline underline-offset-2 hover:text-accent-800 transition-colors"
                  >
                    Read more
                  </button>
                </div>
                <div>
                  <h3 className="text-silver-50 font-semibold text-sm mb-2">Safety &amp; security</h3>
                  <ul className="space-y-1.5">
                    {thingsToKnow.safety.map((item) => (
                      <li key={item} className="text-silver-300 text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar booking card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-44">
              <div className="bg-white border border-silver-700 rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <div className="font-display text-xl font-bold text-silver-50">Check availability</div>
                  <div className="text-silver-300 text-xs mt-0.5">7-night minimum stay</div>
                </div>

                {/* Calendar */}
                <div className="border border-silver-700 rounded-xl p-3 mb-3">
                  <BookingCalendar
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(ci, co) => {
                      setCheckIn(ci);
                      setCheckOut(co);
                    }}
                    intervals={unavailable}
                    loading={loadingAvailability}
                    minNights={7}
                  />
                </div>

                {/* Date summary */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="border border-silver-700 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-silver-300">Check-in</div>
                    <div className="text-silver-50 text-sm mt-1">
                      {checkIn ? formatDate(checkIn) : 'Add date'}
                    </div>
                  </div>
                  <div className="border border-silver-700 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-silver-300">Check-out</div>
                    <div className="text-silver-50 text-sm mt-1">
                      {checkOut ? formatDate(checkOut) : 'Add date'}
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div className="border border-silver-700 rounded-xl p-3 mb-4 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-silver-300">Guests</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-silver-50 text-sm">
                      {guests} {guests === 1 ? 'guest' : 'guests'}
                    </span>
                    <GuestStepper
                      value={guests}
                      max={property.max_guests}
                      onChange={setGuests}
                    />
                  </div>
                </div>

                {/* Pets — only when the property allows them */}
                {thingsToKnow.petsAllowed && (
                  <div className="border border-silver-700 rounded-xl p-3 mb-4 relative">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-silver-300">Pets</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-silver-50 text-sm">
                        {pets} {pets === 1 ? 'pet' : 'pets'}
                      </span>
                      <GuestStepper value={pets} max={MAX_PETS} min={0} onChange={setPets} />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBookClick}
                  disabled={!checkIn || !checkOut}
                  className="w-full py-3.5 bg-accent-800 hover:bg-accent-700 disabled:bg-silver-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                >
                  {checkIn && checkOut ? 'Reserve' : !checkIn ? 'Add dates' : 'Select check-out'}
                </button>

                <div className="text-center text-silver-300 text-xs mt-3">
                  You won't be charged yet. Pricing is shown at booking.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBooking && checkIn && checkOut && (
        <OwnerRezWidgetModal
          property={property}
          arrival={toIso(checkIn)}
          departure={toIso(checkOut)}
          adults={guests}
          pets={thingsToKnow.petsAllowed ? pets : 0}
          onClose={() => setShowBooking(false)}
        />
      )}

      {/* Confirmation shown when the share link is copied (no native share UI) */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-full bg-silver-50 text-white text-sm font-medium shadow-lg">
          Link copied to clipboard
        </div>
      )}

      {/* Property rules modal */}
      {showRules && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-silver-700 w-full max-w-md max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-bold text-silver-50">Property rules</h2>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-full hover:bg-silver-800 flex items-center justify-center text-silver-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              {thingsToKnow.ruleGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-silver-50 font-semibold text-sm mb-2">{group.title}</h3>
                  <ul className="space-y-2">
                    {group.rules.map((rule) => (
                      <li key={rule.label} className="flex items-center gap-2 text-silver-300 text-sm">
                        <RuleIcon tone={rule.tone} />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen scrollable photo gallery */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-silver-700">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowAllPhotos(false)}
                className="w-9 h-9 rounded-full hover:bg-silver-800 flex items-center justify-center text-silver-50 transition-colors"
                aria-label="Close gallery"
              >
                <X size={20} />
              </button>
              <span className="text-silver-50 font-semibold text-sm sm:text-base truncate">
                {property.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full border border-silver-700 hover:border-silver-300 flex items-center justify-center text-silver-100 transition-colors"
                  aria-label="Share"
                >
                  <Share size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllPhotos(false)}
                  className="px-4 py-2 rounded-full bg-accent-800 hover:bg-accent-700 text-white text-sm font-semibold transition-colors"
                >
                  Add dates
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.map((src, i) => (
                <div
                  key={i}
                  className={`overflow-hidden rounded-2xl bg-silver-800/30 ${
                    i === 0 ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-[4/3]'
                  }`}
                >
                  <img
                    src={src}
                    alt={`${property.name} photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleIcon({ tone }: { tone: Rule['tone'] }) {
  if (tone === 'no') return <XCircle size={16} className="shrink-0 text-silver-400" />;
  if (tone === 'guests') return <Users size={16} className="shrink-0 text-silver-300" />;
  if (tone === 'clock') return <Clock size={16} className="shrink-0 text-silver-300" />;
  return <CheckCircle2 size={16} className="shrink-0 text-silver-300" />;
}

function GuestStepper({
  value,
  max,
  min = 1,
  onChange,
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 rounded-full border border-silver-600 text-silver-100 hover:text-silver-50 hover:border-silver-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm"
        aria-label="Decrease guests"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-full border border-silver-600 text-silver-100 hover:text-silver-50 hover:border-silver-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm"
        aria-label="Increase guests"
      >
        +
      </button>
    </div>
  );
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(date: Date, short = false): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: short ? undefined : 'numeric',
  });
}
