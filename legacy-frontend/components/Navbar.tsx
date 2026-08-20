import { useState, useEffect, useRef } from 'react';
import { Menu, X, Phone, Mail, Home } from 'lucide-react';

interface NavbarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

// Menu order matches the live silvergrouprentals.com hamburger panel.
// Each item scrolls to its dedicated on-page section.
const MENU_ITEMS: { label: string; target: string }[] = [
  { label: 'Contact Us', target: 'contact' },
  { label: 'About Us', target: 'about' },
  { label: 'Properties', target: 'properties' },
];

export default function Navbar({ onNavigate, activeSection: _activeSection }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSelect = (target: string) => {
    onNavigate(target);
    setMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-silver-700/60'
          : 'bg-white/85 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <button
            onClick={() => handleSelect('hero')}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-lg border-2 border-accent-800 flex items-center justify-center bg-white">
              <Home size={18} className="text-accent-800" strokeWidth={2.25} />
            </div>
            <div className="text-left leading-tight">
              <div className="font-script text-2xl text-accent-800 group-hover:text-accent-700 transition-colors -mb-1">
                The Silver Group
              </div>
              <div className="text-[10px] tracking-[0.35em] text-silver-300 font-semibold">
                REAL ESTATE
              </div>
            </div>
          </button>

          {/* Right cluster */}
          <div ref={menuRef} className="relative flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-lg text-silver-100 hover:bg-silver-800 transition-colors"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Floating menu panel — matches the live site's right-side dropdown */}
            {menuOpen && (
              <div className="absolute top-full right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-silver-700 py-3 z-50">
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSelect(item.target)}
                    className="w-full text-left px-6 py-3 text-silver-50 hover:text-accent-800 hover:bg-silver-800 transition-colors text-base"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-silver-700 mt-2 pt-3 px-6 space-y-2.5">
                  <a
                    href="tel:+14047790102"
                    className="flex items-center gap-2 text-silver-200 hover:text-accent-800 text-sm transition-colors"
                  >
                    <Phone size={14} />
                    (404) 779-0102
                  </a>
                  <a
                    href="mailto:Bookings@silvergrouprentals.com"
                    className="flex items-center gap-2 text-silver-200 hover:text-accent-800 text-sm transition-colors"
                  >
                    <Mail size={14} className="shrink-0" />
                    <span className="break-all">Bookings@silvergrouprentals.com</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
