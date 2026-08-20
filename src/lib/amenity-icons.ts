import type { IconName } from '../components/icons';

/**
 * Maps amenity labels to icons. The keys are the amenity vocabulary that comes
 * back on live OwnerRez records (and is mirrored in the repo content layer), so
 * they are preserved verbatim — renaming them would silently un-map live data.
 * Matching is case-insensitive with a keyword fallback for unseen values.
 */
const EXACT: Record<string, IconName> = {
  'hot tub': 'pool',
  'free parking': 'parking',
  fridge: 'fridge',
  wifi: 'wifi',
  'bath linens': 'linens',
  'hair dryer': 'wind',
  tv: 'tv',
  'game console': 'game',
  crib: 'crib',
  shower: 'shower',
  toilet: 'bath',
  bathtub: 'bath',
  'fire place': 'fire',
  patio: 'balcony',
  'dedicated workspace': 'workspace',
  'dining table': 'dining',
  garage: 'garage',
  garden: 'garden',
  balcony: 'balcony',
};

const KEYWORDS: [RegExp, IconName][] = [
  [/pool|spa|jacuzzi|hot tub/i, 'pool'],
  [/wifi|wi-fi|internet/i, 'wifi'],
  [/park|driveway|ev charger/i, 'parking'],
  [/kitchen/i, 'kitchen'],
  [/dining|table/i, 'dining'],
  [/fridge|refrigerat/i, 'fridge'],
  [/tv|television|cinema|media/i, 'tv'],
  [/arcade|game|console/i, 'game'],
  [/fire|grill|pit/i, 'fire'],
  [/garden|yard|outdoor|tree/i, 'garden'],
  [/balcon|patio|deck|pavilion/i, 'balcony'],
  [/garage/i, 'garage'],
  [/desk|work|office/i, 'workspace'],
  [/bath|shower|toilet/i, 'bath'],
  [/linen|towel/i, 'linens'],
  [/air|dryer|heat/i, 'wind'],
  [/crib|baby|infant/i, 'crib'],
  [/bed|sleep/i, 'bed'],
];

export function amenityIcon(label: string): IconName {
  const key = label.trim().toLowerCase();
  const exact = EXACT[key];
  if (exact) return exact;
  for (const [pattern, icon] of KEYWORDS) {
    if (pattern.test(label)) return icon;
  }
  return 'check';
}
