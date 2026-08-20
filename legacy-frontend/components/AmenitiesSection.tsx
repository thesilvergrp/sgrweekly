import { Wifi, Car, Utensils } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const highlights = [
  {
    icon: Utensils,
    title: "Chef's Kitchens",
    description: 'Fully equipped gourmet kitchens with premium appliances and everything you need to cook.',
  },
  {
    icon: Wifi,
    title: 'Smart Entertainment',
    description: 'Smart TVs, high-speed WiFi, and media rooms for seamless streaming and connectivity.',
  },
  {
    icon: Car,
    title: 'Free Parking',
    description: 'Convenient covered and open parking at every property — no hassle, no extra cost.',
  },
];

export default function AmenitiesSection() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="amenities" className="py-20 lg:py-28 bg-silver-800/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-accent-400 text-sm font-semibold uppercase tracking-widest">What We Offer</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-silver-50 mt-3 mb-4">
            Resort-Style <span className="text-gradient-warm">Amenities</span>
          </h2>
          <p className="text-silver-400 max-w-xl mx-auto">
            Every home is equipped with premium amenities that rival luxury resorts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, i) => (
            <div
              key={item.title}
              className={`group p-6 rounded-2xl bg-white border border-silver-700 hover:border-accent-500/50 transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-accent-600/10 ${
                isVisible ? 'fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center mb-4 group-hover:bg-accent-100 transition-colors">
                <item.icon size={22} className="text-accent-800" />
              </div>
              <h3 className="font-display text-lg font-semibold text-silver-100 mb-2">{item.title}</h3>
              <p className="text-silver-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
