/** Business facts. Contact details are preserved from the live operation. */
export const site = {
  name: 'Silver Group Rentals',
  shortName: 'Silver Group',
  email: 'Bookings@silvergrouprentals.com',
  phone: '(404) 779-0102',
  phoneHref: 'tel:+14047790102',
  serviceAreas: ['Atlanta', 'Acworth', 'Forest Park'],
  region: 'Georgia',
  responseWindow: 'within 24 hours',
} as const;

/** In-page section ids. These are part of the URL contract (#properties etc.). */
export const sections = [
  { id: 'stays', label: 'Stays' },
  { id: 'amenities', label: 'What you get' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

/**
 * Legacy anchor ids that older links and the previous footer pointed at.
 * Mapped onto the new section ids so inbound links keep working.
 */
export const legacySectionAliases: Record<string, string> = {
  properties: 'stays',
  hero: 'top',
  about: 'about',
  amenities: 'amenities',
  contact: 'contact',
};
