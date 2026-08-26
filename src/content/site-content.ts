/**
 * The editable content document.
 *
 * Everything an operator would plausibly want to change without a developer —
 * headings, body copy, business facts, which homes are featured, and per-stay
 * editorial text — lives in this one typed document.
 *
 * The version below is the BUNDLED DEFAULT. It ships in the JS bundle and is
 * what renders when no remote document is available (or when a remote document
 * is malformed). At runtime `services/content.service.ts` tries to fetch a
 * remote document and merges it over these defaults field by field, so a
 * partial or broken remote document can never blank out the site.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *  • section ids (`stays`, `about`, …) — they are part of the URL contract;
 *  • navigation structure — structural, not editorial;
 *  • operational property facts (bed/bath/sleeps/address) — OwnerRez owns those;
 *  • per-stay editorial text — it has its own, much larger document
 *    (content/stays-document.ts) so the two can be cached and edited apart;
 *  • anything rendered as HTML. Every string here is rendered as React text and
 *    is therefore escaped; nothing in the app uses dangerouslySetInnerHTML, so
 *    a compromised content document cannot inject script.
 */

export interface SiteMeta {
  title: string;
  description: string;
}

export interface BusinessFacts {
  name: string;
  shortName: string;
  email: string;
  phone: string;
  /** tel: URL. Kept separate so the display format stays free-form. */
  phoneHref: string;
  serviceAreas: string[];
  region: string;
  responseWindow: string;
}

export interface HeroContent {
  overline: string;
  headline: { lead: string; emphasis: string; tail: string };
  lede: string;
  /** The numbers are derived from live data; only the labels are editable. */
  statLabels: { homes: string; areas: string; minimumStay: string };
}

export interface SectionIntro {
  /** Two-digit index shown beside the heading. */
  index: string;
  overline: string;
  title: string;
  lede: string;
}

export interface FeatureItem {
  /** Icon name from the project icon set; unknown values fall back safely. */
  icon: string;
  title: string;
  body: string;
}

export interface AmenitiesContent extends SectionIntro {
  items: FeatureItem[];
}

export interface AboutContent extends SectionIntro {
  paragraphs: string[];
  pullQuote: string;
  points: FeatureItem[];
}

export interface ContactContent extends SectionIntro {
  /** Options in the "what is it about" select. */
  topics: string[];
  smallprint: string;
}

/** Terms that apply to every stay unless a property overrides them. */
export interface StayDefaults {
  checkInFrom: string;
  checkOutBy: string;
  cancellationPolicy: string;
  maxPets: number;
}

export interface FooterContent {
  blurb: string;
  exploreTitle: string;
  contactTitle: string;
  areasTitle: string;
}

export interface SiteContentDocument {
  /** Bumped when the shape changes incompatibly. */
  version: number;
  /** ISO timestamp, set by whatever writes the document. Informational. */
  updatedAt?: string;
  meta: SiteMeta;
  business: BusinessFacts;
  hero: HeroContent;
  collection: SectionIntro;
  amenities: AmenitiesContent;
  about: AboutContent;
  contact: ContactContent;
  footer: FooterContent;
  stayDefaults: StayDefaults;
  /**
   * The properties PUBLISHED on the site, by OwnerRez id.
   *
   * This is the site's entire visible inventory — not merely what appears in
   * the home-page grid. Anything absent from this list is invisible to the
   * public site: it is not in the grid, cannot be found by search, will not
   * resolve from a ?property= link, and is not plotted on the map. OwnerRez may
   * hold many more active properties; only these are advertised here.
   */
  featuredStayIds: string[];
}

export const CONTENT_VERSION = 1;

export const defaultSiteContent: SiteContentDocument = {
  version: CONTENT_VERSION,

  meta: {
    title: 'Silver Group Rentals — Whole-home stays across metro Atlanta',
    description:
      'Book a whole home in Atlanta, Acworth or Forest Park. Weekly stays, live availability, and a direct line to the people who look after every property.',
  },

  business: {
    name: 'Silver Group Rentals',
    shortName: 'Silver Group',
    email: 'Bookings@silvergrouprentals.com',
    phone: '(404) 779-0102',
    phoneHref: 'tel:+14047790102',
    serviceAreas: ['Atlanta', 'Acworth', 'Forest Park'],
    region: 'Georgia',
    responseWindow: 'within 24 hours',
  },

  hero: {
    overline: 'Atlanta · Acworth · Forest Park',
    headline: { lead: 'Room for ', emphasis: 'everyone', tail: ' you are bringing.' },
    lede: 'Whole homes booked by the week — kitchens that fit a real dinner, beds for the whole group, and one number to call if anything needs sorting.',
    statLabels: {
      homes: 'homes, all managed by us',
      areas: 'neighbourhoods across the metro',
      minimumStay: 'night minimum, booked in whole weeks',
    },
  },

  collection: {
    index: '01',
    overline: 'The collection',
    title: 'Homes we would happily stay in ourselves',
    lede: 'Every property is managed by us directly — the same people who answer the phone are the ones who set the house up before you arrive.',
  },

  amenities: {
    index: '02',
    overline: 'What you get',
    title: 'The same standard in every house',
    lede: 'Different homes, different sizes — but the things that make a week away work are non-negotiable.',
    items: [
      {
        icon: 'kitchen',
        title: 'Kitchens that get used',
        body: 'Full-size appliances, cookware that matches the guest count, and counter space to actually work on.',
      },
      {
        icon: 'game',
        title: 'Somewhere to gather',
        body: 'Game rooms, media walls and covered patios — the parts of a trip nobody plans but everybody remembers.',
      },
      {
        icon: 'parking',
        title: 'Parking off the street',
        body: 'Driveways and garages at every home, so a full car park is not part of your arrival.',
      },
      {
        icon: 'key',
        title: 'A person, not a portal',
        body: 'Same team for the booking, the check-in and the "where is the thermostat" text at 9pm.',
      },
    ],
  },

  about: {
    index: '03',
    overline: 'Who we are',
    title: 'A small portfolio, closely held',
    lede: '',
    paragraphs: [
      'Silver Group Rentals is a family-run collection of homes across metro Atlanta. We are not a channel, an agency or a call centre — we own the calendar, we set the houses up, and we answer the phone.',
      'Because we book by the week, the homes are furnished for living rather than for photographs: laundry that works, a kitchen you can cook a real meal in, and space to be in the same house without being on top of each other.',
    ],
    pullQuote: 'If we would not put our own family in it, it is not in the collection.',
    points: [
      {
        icon: 'compass',
        title: 'Close to the reason you came',
        body: 'Stadium weekends, tournaments at LakePoint, airport-early departures — the homes are placed around what people actually travel here for.',
      },
      {
        icon: 'users',
        title: 'Built for a group, not a couple',
        body: 'Bed counts and bathrooms are listed honestly, so nobody arrives to find they are on a sofa.',
      },
      {
        icon: 'shield',
        title: 'Set up before you arrive',
        body: 'Every house is walked, cleaned and checked between stays by the people who manage it.',
      },
    ],
  },

  contact: {
    index: '04',
    overline: 'Get in touch',
    title: 'Ask us anything before you book',
    lede: 'Dates, group sizes, whether a house works for what you have in mind — we would rather answer first than have you guess.',
    topics: [
      'Booking a home',
      'Availability for specific dates',
      'Hosting an event',
      'Something else',
    ],
    smallprint: 'We usually reply the same day. Your details go to us and nobody else.',
  },

  footer: {
    blurb:
      'Whole homes across metro Atlanta, looked after by the same small team that answers the phone. Weekly stays, straight answers, no surprises at check-in.',
    exploreTitle: 'Explore',
    contactTitle: 'Talk to us',
    areasTitle: 'Where we host',
  },

  // The six published properties. Add an id here to put a property on the site.
  stayDefaults: {
    checkInFrom: '4:00 PM',
    checkOutBy: '11:00 AM',
    cancellationPolicy:
      'Full refund for cancellations made at least 30 days before arrival. No refund inside 30 days.',
    maxPets: 2,
  },

  featuredStayIds: [
    '478121', // The Silver Suite I
    '476709', // The Silver Studio II
    '444166', // Gateway City Getaway II (OwnerRez 'Forest Park', 575 Springwood Dr #4)
    '451644', // The Silver Chic Studio
    '428819', // The Silver Spot
    '395467', // The Silver Cottage
  ],
};
