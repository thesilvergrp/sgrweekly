import type { Property } from '../lib/types';
import PropertyCard from './PropertyCard';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface PropertyGridProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export default function PropertyGrid({ properties, onSelectProperty }: PropertyGridProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  const sorted = [...properties].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="properties" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className={`text-center mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-accent-400 text-sm font-semibold uppercase tracking-widest">Our Portfolio</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-silver-50 mt-3 mb-4">
            Premium <span className="text-gradient-warm">Vacation Homes</span>
          </h2>
          <p className="text-silver-400 max-w-xl mx-auto">
            From intimate cottages to grand estates, find the perfect home for your Atlanta getaway.
          </p>
        </div>

        {/* Grid */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((property, i) => (
              <PropertyCard
                key={property.id}
                property={property}
                onSelect={onSelectProperty}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-silver-500 text-lg">
            No properties available right now.
          </div>
        )}
      </div>
    </section>
  );
}
