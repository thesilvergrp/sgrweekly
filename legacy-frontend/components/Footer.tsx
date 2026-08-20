import { MapPin, Mail, Phone, ArrowUp, Home } from 'lucide-react';

interface FooterProps {
  /** Routes through App so links work even from a property detail view
      (which must unmount before the target section exists in the DOM). */
  onNavigate: (section: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-accent-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-lg border-2 border-white/80 flex items-center justify-center">
                <Home size={18} className="text-white" strokeWidth={2.25} />
              </div>
              <div className="leading-tight">
                <div className="font-script text-2xl text-white -mb-1">The Silver Group</div>
                <div className="text-[10px] tracking-[0.35em] text-white/70 font-semibold">REAL ESTATE</div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-xs">
              Atlanta vacation rentals and event venues — designer-styled homes
              for the moments that matter.
            </p>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <MapPin size={14} />
              Atlanta, Acworth & Forest Park, GA
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <div className="space-y-2.5">
              {['Properties', 'Amenities', 'About', 'Contact'].map((link) => (
                <button
                  key={link}
                  onClick={() => onNavigate(link.toLowerCase())}
                  className="block text-white/70 hover:text-white text-sm transition-colors"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact</h4>
            <div className="space-y-3">
              <a
                href="mailto:Bookings@silvergrouprentals.com"
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
              >
                <Mail size={14} />
                Bookings@silvergrouprentals.com
              </a>
              <a
                href="tel:+14047790102"
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
              >
                <Phone size={14} />
                (404) 779-0102
              </a>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <MapPin size={14} />
                Serving Atlanta, Acworth & Forest Park
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-xs">
            &copy; {currentYear} Silver Group Rentals. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors"
          >
            <ArrowUp size={12} />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
