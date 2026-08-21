import type {
  AboutContent,
  AmenitiesContent,
  BusinessFacts,
  ContactContent,
  FeatureItem,
  FooterContent,
  HeroContent,
  SectionIntro,
  SiteContentDocument,
  SiteMeta,
  StayDefaults,
} from '../content/site-content';
import {
  STAYS_CONTENT_VERSION,
  type StayEditorial,
  type StaysContentDocument,
} from '../content/stays-document';

/**
 * Parses a remote content document.
 *
 * A remote document is UNTRUSTED INPUT: it arrives over the network and is
 * edited by hand. Every field is validated and falls back to the bundled
 * default individually, so a typo in one heading cannot blank the page and a
 * missing section cannot throw. Anything unrecognised is ignored.
 *
 * The parser never trusts a string to be safe to render as markup — nothing in
 * the app renders content as HTML — and it refuses URLs that are not http(s),
 * which is the only place a content document could otherwise smuggle a
 * `javascript:` payload into an attribute.
 */

type Unknown = Record<string, unknown>;

function asObject(value: unknown): Unknown {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Unknown) : {};
}

/** Non-empty trimmed string, or the fallback. */
function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** Optional string: returns undefined rather than a fallback. */
function optionalStr(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function strList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return cleaned.length > 0 ? cleaned : fallback;
}

function optionalStrList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Only http(s) URLs survive — never `javascript:`, `data:` or a bare path. */
function isSafeUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function urlList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value.filter(isSafeUrl);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** tel:/mailto:/http(s) only, for the phone link. */
function safeLink(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return /^(tel:|mailto:|https?:)/i.test(value.trim()) ? value.trim() : fallback;
}

function features(value: unknown, fallback: FeatureItem[]): FeatureItem[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((raw, index) => {
      const item = asObject(raw);
      const reference = fallback[index] ?? fallback[0];
      const title = optionalStr(item.title);
      const body = optionalStr(item.body);
      if (!title && !body) return null;
      return {
        icon: str(item.icon, reference?.icon ?? 'check'),
        title: title ?? reference?.title ?? '',
        body: body ?? reference?.body ?? '',
      };
    })
    .filter((item): item is FeatureItem => item !== null);
  return items.length > 0 ? items : fallback;
}

function intro(value: unknown, fallback: SectionIntro): SectionIntro {
  const raw = asObject(value);
  return {
    index: str(raw.index, fallback.index),
    overline: str(raw.overline, fallback.overline),
    title: str(raw.title, fallback.title),
    lede: typeof raw.lede === 'string' ? raw.lede : fallback.lede,
  };
}

function meta(value: unknown, fallback: SiteMeta): SiteMeta {
  const raw = asObject(value);
  return {
    title: str(raw.title, fallback.title),
    description: str(raw.description, fallback.description),
  };
}

function business(value: unknown, fallback: BusinessFacts): BusinessFacts {
  const raw = asObject(value);
  return {
    name: str(raw.name, fallback.name),
    shortName: str(raw.shortName, fallback.shortName),
    email: str(raw.email, fallback.email),
    phone: str(raw.phone, fallback.phone),
    phoneHref: safeLink(raw.phoneHref, fallback.phoneHref),
    serviceAreas: strList(raw.serviceAreas, fallback.serviceAreas),
    region: str(raw.region, fallback.region),
    responseWindow: str(raw.responseWindow, fallback.responseWindow),
  };
}

function hero(value: unknown, fallback: HeroContent): HeroContent {
  const raw = asObject(value);
  const headline = asObject(raw.headline);
  const labels = asObject(raw.statLabels);
  return {
    overline: str(raw.overline, fallback.overline),
    headline: {
      // A lead of "Room for " ends in a space on purpose, so this one field
      // accepts whitespace-only rather than being trimmed away.
      lead: typeof headline.lead === 'string' ? headline.lead : fallback.headline.lead,
      emphasis: str(headline.emphasis, fallback.headline.emphasis),
      tail: typeof headline.tail === 'string' ? headline.tail : fallback.headline.tail,
    },
    lede: str(raw.lede, fallback.lede),
    statLabels: {
      homes: str(labels.homes, fallback.statLabels.homes),
      areas: str(labels.areas, fallback.statLabels.areas),
      minimumStay: str(labels.minimumStay, fallback.statLabels.minimumStay),
    },
  };
}

function amenities(value: unknown, fallback: AmenitiesContent): AmenitiesContent {
  const raw = asObject(value);
  return { ...intro(raw, fallback), items: features(raw.items, fallback.items) };
}

function about(value: unknown, fallback: AboutContent): AboutContent {
  const raw = asObject(value);
  return {
    ...intro(raw, fallback),
    paragraphs: strList(raw.paragraphs, fallback.paragraphs),
    pullQuote: str(raw.pullQuote, fallback.pullQuote),
    points: features(raw.points, fallback.points),
  };
}

function contact(value: unknown, fallback: ContactContent): ContactContent {
  const raw = asObject(value);
  return {
    ...intro(raw, fallback),
    topics: strList(raw.topics, fallback.topics),
    smallprint: str(raw.smallprint, fallback.smallprint),
  };
}

function footer(value: unknown, fallback: FooterContent): FooterContent {
  const raw = asObject(value);
  return {
    blurb: str(raw.blurb, fallback.blurb),
    exploreTitle: str(raw.exploreTitle, fallback.exploreTitle),
    contactTitle: str(raw.contactTitle, fallback.contactTitle),
    areasTitle: str(raw.areasTitle, fallback.areasTitle),
  };
}

function stayDefaults(value: unknown, fallback: StayDefaults): StayDefaults {
  const raw = asObject(value);
  const maxPets = typeof raw.maxPets === 'number' && Number.isFinite(raw.maxPets)
    ? Math.max(0, Math.round(raw.maxPets))
    : fallback.maxPets;
  return {
    checkInFrom: str(raw.checkInFrom, fallback.checkInFrom),
    checkOutBy: str(raw.checkOutBy, fallback.checkOutBy),
    cancellationPolicy: str(raw.cancellationPolicy, fallback.cancellationPolicy),
    maxPets,
  };
}

/** Ids must be numeric OwnerRez ids; an empty result falls back to the default. */
function stayIds(value: unknown, fallback: string[]): string[] {
  const cleaned = strList(value, fallback).filter((id) => /^\d+$/.test(id));
  return cleaned.length > 0 ? cleaned : fallback;
}

export function parseSiteContent(
  raw: unknown,
  fallback: SiteContentDocument,
): SiteContentDocument {
  const document = asObject(raw);

  // An incompatible major version is ignored wholesale rather than merged —
  // a v2 document rendered by a v1 build would be worse than the defaults.
  const version = typeof document.version === 'number' ? document.version : fallback.version;
  if (version !== fallback.version) return fallback;

  return {
    version,
    updatedAt: optionalStr(document.updatedAt),
    meta: meta(document.meta, fallback.meta),
    business: business(document.business, fallback.business),
    hero: hero(document.hero, fallback.hero),
    collection: intro(document.collection, fallback.collection),
    amenities: amenities(document.amenities, fallback.amenities),
    about: about(document.about, fallback.about),
    contact: contact(document.contact, fallback.contact),
    footer: footer(document.footer, fallback.footer),
    stayDefaults: stayDefaults(document.stayDefaults, fallback.stayDefaults),
    featuredStayIds: stayIds(document.featuredStayIds, fallback.featuredStayIds),
  };
}

/** A positive integer, or undefined. */
function optionalCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : undefined;
}

function stayEditorial(value: unknown): StayEditorial | null {
  const item = asObject(value);
  const override: StayEditorial = {
    displayName: optionalStr(item.displayName),
    summary: optionalStr(item.summary),
    story: optionalStr(item.story),
    amenityTags: optionalStrList(item.amenityTags),
    photos: urlList(item.photos),
    spotlight: typeof item.spotlight === 'boolean' ? item.spotlight : undefined,
    bedCount: optionalCount(item.bedCount),
    areaSqFt: item.areaSqFt === null ? null : optionalCount(item.areaSqFt),
    cancellationPolicy: optionalStr(item.cancellationPolicy),
    petsAllowed: typeof item.petsAllowed === 'boolean' ? item.petsAllowed : undefined,
    maxPets: optionalCount(item.maxPets),
  };
  return Object.values(override).some((field) => field !== undefined) ? override : null;
}

/**
 * Parses the per-stay editorial document. Keys must be numeric OwnerRez ids;
 * anything else is dropped rather than trusted. A malformed document yields an
 * empty overlay, which leaves the bundled catalog rendering untouched.
 */
export function parseStaysContent(raw: unknown): StaysContentDocument {
  const document = asObject(raw);
  const version = typeof document.version === 'number' ? document.version : STAYS_CONTENT_VERSION;
  if (version !== STAYS_CONTENT_VERSION) return { version: STAYS_CONTENT_VERSION, stays: {} };

  const stays: Record<string, StayEditorial> = {};
  for (const [id, entry] of Object.entries(asObject(document.stays))) {
    if (!/^\d+$/.test(id)) continue;
    const override = stayEditorial(entry);
    if (override) stays[id] = override;
  }

  return { version, updatedAt: optionalStr(document.updatedAt), stays };
}

export { isSafeUrl };
