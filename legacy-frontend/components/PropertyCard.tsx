import type { Property } from '../lib/types';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  index: number;
}

export default function PropertyCard({ property, onSelect, index }: PropertyCardProps) {
  return (
    <div
      onClick={() => onSelect(property)}
      className="group cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow">
        <img
          src={property.images[0] || 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        {/* Subtle pagination indicator at bottom of the photo, matching the live site */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/80 shadow" />
      </div>

      <div className="px-1">
        <div className="text-silver-300 text-sm">{property.location}</div>

        <div className="mt-0.5">
          <h3 className="font-semibold text-silver-50 text-[15px] group-hover:text-accent-800 transition-colors leading-snug">
            {property.name}
          </h3>
        </div>

        <div className="text-silver-300 text-sm mt-0.5">
          {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} ${property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`} &middot; {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
        </div>
      </div>
    </div>
  );
}
