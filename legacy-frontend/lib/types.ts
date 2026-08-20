export interface Property {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  location: string;
  address: string;
  /** Geo coordinates for the map. Populated from OwnerRez; omitted in the
      static fallback (the map then falls back to general area centers). */
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  price_per_night: number;
  amenities: string[];
  images: string[];
  featured: boolean;
  property_type: string;
  sqft: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingInquiry {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyPricing {
  id: string;
  property_id: string;
  date: string;
  price: number;
  available: boolean;
  minimum_stay: number;
  created_at: string;
}
