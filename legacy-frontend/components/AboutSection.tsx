import { MapPin, Heart, Clock } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { LOGO_URL } from '../lib/assets';

export default function AboutSection() {
  const { ref, isVisible } = useScrollAnimation();

  const values = [
    {
      icon: Heart,
      title: 'Designer Interiors',
      description: 'Spacious, designer-styled homes built for groups — from intimate getaways to full-house celebrations.',
    },
    {
      icon: Clock,
      title: 'Entertainment Built In',
      description: 'Smart TVs and game rooms — fun for guests of every age and group size.',
    },
    {
      icon: MapPin,
      title: 'Atlanta Location, Atlanta Soul',
      description: 'Across Atlanta, Acworth, and Forest Park — close to the stadium, the arena, the airport, and the city you came for.',
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div ref={ref} className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={LOGO_URL}
                alt="The Silver Group"
                className="w-full h-auto object-contain"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-white border border-silver-700 rounded-xl p-5 shadow-xl shadow-black/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                  <MapPin size={18} className="text-accent-800" />
                </div>
                <div>
                  <div className="text-silver-50 font-semibold text-sm">Properties</div>
                  <div className="text-silver-300 text-xs">Across Atlanta Metro</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <span className="text-accent-400 text-sm font-semibold uppercase tracking-widest">About Us</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-silver-50 mt-3 mb-6">
              A Curated Collection of <span className="text-gradient-warm">Atlanta Homes</span>
            </h2>
            <p className="text-silver-300 leading-relaxed mb-4">
              Silver Group Rentals is a curated collection of Atlanta-area homes designed for the moments
              that matter — milestone celebrations, family reunions, work weekends, and getaways that
              deserve a place worth showing up to.
            </p>
            <p className="text-silver-400 leading-relaxed mb-8">
              Our specialists plan, prep, and oversee each property so nothing about your stay feels left
              to chance. Spacious, designer-styled homes built for groups — from intimate getaways to
              full-house celebrations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {values.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon size={16} className="text-accent-800" />
                  </div>
                  <div>
                    <h4 className="text-silver-100 font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-silver-500 text-xs leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
