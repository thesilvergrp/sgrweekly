import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Minus, Plus } from 'lucide-react';
import type { Property } from '../lib/types';
import RangeCalendar from './RangeCalendar';

type FieldKey = 'where' | 'when' | 'who' | null;

interface HeroProps {
  onExplore: () => void;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export default function Hero({ onExplore, properties, onSelectProperty }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative pt-24 pb-12 lg:pt-28 lg:pb-16 bg-white"
    >
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
        {/* No overflow-hidden here: the search dropdown must be able to extend
            past the image. Corners are rounded on the image + overlay instead. */}
        <div className="relative rounded-2xl h-[420px] sm:h-[520px] lg:h-[620px]">
          <img
            src="https://images.pexels.com/photos/33133738/pexels-photo-33133738.jpeg"
            alt="Atlanta skyline"
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
          />
          <div className="hero-overlay absolute inset-0 rounded-2xl" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
            <h1
              className="font-display font-bold text-white leading-[1.05] tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl fade-in-up"
              style={{ animationDelay: '0.05s' }}
            >
              Atlanta Stays,
              <br />
              Designed for You
            </h1>

            <p
              className="mt-5 text-white/90 text-base sm:text-lg max-w-xl leading-relaxed fade-in-up"
              style={{ animationDelay: '0.15s' }}
            >
              Vacation homes and event venues across metro Atlanta with private
              pools, arcades, and outdoor pavilions.
            </p>

            <div
              className="mt-10 w-full max-w-3xl fade-in-up"
              style={{ animationDelay: '0.25s' }}
            >
              <SearchBar
                onSearch={onExplore}
                properties={properties}
                onSelectProperty={onSelectProperty}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchBar({
  onSearch,
  properties,
  onSelectProperty,
}: {
  onSearch: () => void;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}) {
  const [open, setOpen] = useState<FieldKey>(null);
  const [where, setWhere] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [pets, setPets] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = () => {
    setOpen(null);
    onSearch();
  };

  const whenLabel =
    checkIn && checkOut
      ? `${formatShort(checkIn)} – ${formatShort(checkOut)}`
      : checkIn
      ? formatShort(checkIn)
      : 'When';
  const whoLabel = guests + pets <= 1 ? '1 guest' : `${guests} guests${pets > 0 ? `, ${pets} pet${pets > 1 ? 's' : ''}` : ''}`;

  const propertyQuery = where.trim().toLowerCase();
  const matches = propertyQuery
    ? properties.filter((p) => p.name.toLowerCase().includes(propertyQuery))
    : [];

  return (
    <div ref={wrapRef} className="relative">
      <div className="glass-light rounded-full flex items-center p-1.5 sm:p-2 gap-1">
        <Pill
          icon={MapPin}
          label={where || 'Where'}
          placeholder="Where"
          active={open === 'where'}
          onClick={() => setOpen(open === 'where' ? null : 'where')}
        />
        <Divider />
        <Pill
          icon={Calendar}
          label={whenLabel}
          placeholder="When"
          active={open === 'when'}
          onClick={() => setOpen(open === 'when' ? null : 'when')}
        />
        <Divider />
        <Pill
          icon={Users}
          label={whoLabel}
          placeholder="Who"
          active={open === 'who'}
          onClick={() => setOpen(open === 'who' ? null : 'who')}
          filled={guests > 1 || pets > 0}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="ml-1 shrink-0 inline-flex items-center gap-2 bg-accent-800 hover:bg-accent-700 text-white font-semibold rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {open === 'where' && (
        <DropdownPanel align="left">
          <input
            type="text"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Search properties..."
            className="w-full px-4 py-3 bg-silver-800 border border-silver-700 rounded-xl text-silver-100 placeholder-silver-400 text-sm focus:outline-none focus:border-accent-700 focus:ring-2 focus:ring-accent-200"
            autoFocus
          />
          {!propertyQuery ? (
            <div className="mt-4 px-1 text-silver-300 text-sm">Start typing to find a property.</div>
          ) : (
            <div className="mt-4 space-y-1 max-h-72 overflow-y-auto">
              {matches.length > 0 ? (
                matches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setOpen(null);
                      onSelectProperty(p);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg hover:bg-silver-800 transition-colors text-left"
                  >
                    <div className="text-silver-50 text-sm font-medium leading-tight truncate">{p.name}</div>
                    <div className="text-silver-300 text-xs leading-tight truncate">{p.location}</div>
                  </button>
                ))
              ) : (
                <div className="px-1 py-2 text-silver-300 text-sm">No properties match “{where}”.</div>
              )}
            </div>
          )}
        </DropdownPanel>
      )}

      {open === 'when' && (
        <DropdownPanel align="center" wide>
          <div className="flex items-center justify-between mb-4">
            <span className="text-silver-50 font-semibold text-sm">Select dates</span>
            <button
              type="button"
              onClick={() => { setCheckIn(''); setCheckOut(''); }}
              className="text-silver-300 hover:text-accent-800 text-xs underline"
            >
              Clear dates
            </button>
          </div>
          <RangeCalendar
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
          />
        </DropdownPanel>
      )}

      {open === 'who' && (
        <DropdownPanel align="right">
          <Counter label="Guests" value={guests} min={1} onChange={setGuests} />
          <div className="border-t border-silver-700 my-3" />
          <Counter label="Pets" value={pets} min={0} onChange={setPets} />
        </DropdownPanel>
      )}
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
  placeholder,
  active,
  filled = false,
  onClick,
}: {
  icon: typeof MapPin;
  label: string;
  placeholder: string;
  active: boolean;
  filled?: boolean;
  onClick: () => void;
}) {
  const showPlaceholder = label === placeholder;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full transition-all ${
        active
          ? 'bg-white shadow-md ring-1 ring-silver-600'
          : filled
          ? 'bg-white/80'
          : 'hover:bg-white/60'
      }`}
    >
      <Icon size={16} className={`shrink-0 ${active ? 'text-accent-800' : 'text-silver-300'}`} />
      <span
        className={`text-sm truncate ${
          showPlaceholder ? 'text-silver-300' : 'text-silver-50 font-medium'
        }${active ? ' text-silver-50' : ''}`}
      >
        {label}
      </span>
    </button>
  );
}

function Divider() {
  return <span className="hidden sm:block w-px h-6 bg-silver-600 shrink-0" />;
}

function DropdownPanel({
  children,
  align,
  wide = false,
}: {
  children: React.ReactNode;
  align: 'left' | 'center' | 'right';
  wide?: boolean;
}) {
  const alignClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const widthClass = wide
    ? 'w-[min(44rem,calc(100vw-2rem))]'
    : 'w-[min(28rem,calc(100vw-2rem))]';
  return (
    <div
      className={`absolute top-full mt-3 z-30 ${widthClass} bg-white rounded-2xl shadow-2xl border border-silver-700 p-5 ${alignClass}`}
    >
      {children}
    </div>
  );
}

function Counter({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-silver-50 text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-full border border-silver-600 flex items-center justify-center text-silver-100 hover:border-silver-300 hover:text-silver-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-silver-50 text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-silver-600 flex items-center justify-center text-silver-100 hover:border-silver-300 hover:text-silver-50 transition-colors"
          aria-label={`Increase ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function formatShort(iso: string): string {
  if (!iso) return '';
  // Parse as local (not UTC) so the displayed day can't drift by one.
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
