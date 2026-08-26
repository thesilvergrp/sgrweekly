import type {
  AboutContent,
  AmenitiesContent,
  BusinessFacts,
  ContactContent,
  FooterContent,
  HeroContent,
  SectionIntro,
  SiteContentDocument,
  SiteMeta,
  StayDefaults,
} from '../../content/site-content';
import { FeatureListEditor, StringListEditor, TextBlock, TextRow } from './controls';
import styles from './Admin.module.css';

type Patch = (patch: Partial<SiteContentDocument>) => void;

/** Shared index / overline / title / lede block. */
function IntroFields({ value, onChange }: { value: SectionIntro; onChange: (next: SectionIntro) => void }) {
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>Section heading</p>
      <div className={styles.grid2}>
        <TextRow label="Index" hint="Two digits, e.g. 01" value={value.index} onChange={(index) => onChange({ ...value, index })} />
        <TextRow label="Overline" value={value.overline} onChange={(overline) => onChange({ ...value, overline })} />
      </div>
      <TextRow label="Title" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      <TextBlock label="Lede" value={value.lede} onChange={(lede) => onChange({ ...value, lede })} required={false} />
    </div>
  );
}

export function MetaPanel({ value, patch }: { value: SiteMeta; patch: Patch }) {
  const set = (next: Partial<SiteMeta>) => patch({ meta: { ...value, ...next } });
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>Browser and search</p>
      <TextRow label="Page title" value={value.title} onChange={(title) => set({ title })} />
      <TextBlock
        label="Meta description"
        hint="Search engines and social cards read the version baked into the page at build time; editing here updates the live browser tab and in-page description only."
        value={value.description}
        onChange={(description) => set({ description })}
      />
    </div>
  );
}

export function BusinessPanel({ value, patch }: { value: BusinessFacts; patch: Patch }) {
  const set = (next: Partial<BusinessFacts>) => patch({ business: { ...value, ...next } });
  return (
    <>
      <div className={styles.group}>
        <p className={styles.groupTitle}>Identity</p>
        <div className={styles.grid2}>
          <TextRow label="Business name" value={value.name} onChange={(name) => set({ name })} />
          <TextRow label="Short name" value={value.shortName} onChange={(shortName) => set({ shortName })} />
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupTitle}>Contact</p>
        <div className={styles.grid2}>
          <TextRow label="Email" value={value.email} onChange={(email) => set({ email })} />
          <TextRow label="Phone (displayed)" value={value.phone} onChange={(phone) => set({ phone })} />
        </div>
        <TextRow
          label="Phone link"
          hint="Must start with tel: — anything else is rejected when the document is read."
          value={value.phoneHref}
          onChange={(phoneHref) => set({ phoneHref })}
        />
        <TextRow
          label="Reply-time wording"
          hint='Appears as "Usually …" and "We will reply …".'
          value={value.responseWindow}
          onChange={(responseWindow) => set({ responseWindow })}
        />
        <TextRow label="Region" value={value.region} onChange={(region) => set({ region })} />
      </div>

      <StringListEditor
        label="Service areas"
        hint="Listed in the footer and the map caption."
        values={value.serviceAreas}
        onChange={(serviceAreas) => set({ serviceAreas })}
        addLabel="Add area"
      />
    </>
  );
}

export function HeroPanel({ value, patch }: { value: HeroContent; patch: Patch }) {
  const set = (next: Partial<HeroContent>) => patch({ hero: { ...value, ...next } });
  return (
    <>
      <div className={styles.group}>
        <p className={styles.groupTitle}>Headline</p>
        <TextRow label="Overline" value={value.overline} onChange={(overline) => set({ overline })} />
        <p className={styles.panelHint}>
          The headline is three parts so the middle can be italicised. Mind the spaces at the end of
          the first part and the start of the last.
        </p>
        <TextRow
          label="Headline start"
          value={value.headline.lead}
          onChange={(lead) => set({ headline: { ...value.headline, lead } })}
        />
        <TextRow
          label="Headline emphasis"
          value={value.headline.emphasis}
          onChange={(emphasis) => set({ headline: { ...value.headline, emphasis } })}
        />
        <TextRow
          label="Headline end"
          value={value.headline.tail}
          onChange={(tail) => set({ headline: { ...value.headline, tail } })}
        />
        <TextBlock label="Lede" value={value.lede} onChange={(lede) => set({ lede })} />
      </div>

      <div className={styles.group}>
        <p className={styles.groupTitle}>Stat labels</p>
        <p className={styles.panelHint}>
          The numbers are counted from live data — only the wording beneath them is editable.
        </p>
        <TextRow
          label="Homes"
          value={value.statLabels.homes}
          onChange={(homes) => set({ statLabels: { ...value.statLabels, homes } })}
        />
        <TextRow
          label="Areas"
          value={value.statLabels.areas}
          onChange={(areas) => set({ statLabels: { ...value.statLabels, areas } })}
        />
        <TextRow
          label="Minimum stay"
          value={value.statLabels.minimumStay}
          onChange={(minimumStay) => set({ statLabels: { ...value.statLabels, minimumStay } })}
        />
      </div>
    </>
  );
}

export function CollectionPanel({ value, patch }: { value: SectionIntro; patch: Patch }) {
  return <IntroFields value={value} onChange={(collection) => patch({ collection })} />;
}

export function AmenitiesPanel({ value, patch }: { value: AmenitiesContent; patch: Patch }) {
  return (
    <>
      <IntroFields value={value} onChange={(intro) => patch({ amenities: { ...value, ...intro } })} />
      <FeatureListEditor
        label="Feature cards"
        values={value.items}
        onChange={(items) => patch({ amenities: { ...value, items } })}
      />
    </>
  );
}

export function AboutPanel({ value, patch }: { value: AboutContent; patch: Patch }) {
  return (
    <>
      <IntroFields value={value} onChange={(intro) => patch({ about: { ...value, ...intro } })} />
      <StringListEditor
        label="Paragraphs"
        values={value.paragraphs}
        multiline
        onChange={(paragraphs) => patch({ about: { ...value, paragraphs } })}
        addLabel="Add paragraph"
      />
      <div className={styles.group}>
        <p className={styles.groupTitle}>Pull quote</p>
        <TextBlock
          label="Pull quote"
          value={value.pullQuote}
          onChange={(pullQuote) => patch({ about: { ...value, pullQuote } })}
        />
      </div>
      <FeatureListEditor
        label="Points"
        values={value.points}
        onChange={(points) => patch({ about: { ...value, points } })}
      />
    </>
  );
}

export function ContactPanel({ value, patch }: { value: ContactContent; patch: Patch }) {
  return (
    <>
      <IntroFields value={value} onChange={(intro) => patch({ contact: { ...value, ...intro } })} />
      <StringListEditor
        label="Enquiry topics"
        hint="The options in the form's dropdown."
        values={value.topics}
        onChange={(topics) => patch({ contact: { ...value, topics } })}
        addLabel="Add topic"
      />
      <div className={styles.group}>
        <p className={styles.groupTitle}>Small print</p>
        <TextBlock
          label="Small print"
          value={value.smallprint}
          onChange={(smallprint) => patch({ contact: { ...value, smallprint } })}
        />
      </div>
    </>
  );
}

export function FooterPanel({ value, patch }: { value: FooterContent; patch: Patch }) {
  const set = (next: Partial<FooterContent>) => patch({ footer: { ...value, ...next } });
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>Footer</p>
      <TextBlock label="Blurb" value={value.blurb} onChange={(blurb) => set({ blurb })} />
      <div className={styles.grid2}>
        <TextRow label="Links column title" value={value.exploreTitle} onChange={(exploreTitle) => set({ exploreTitle })} />
        <TextRow label="Contact column title" value={value.contactTitle} onChange={(contactTitle) => set({ contactTitle })} />
      </div>
      <TextRow label="Areas column title" value={value.areasTitle} onChange={(areasTitle) => set({ areasTitle })} />
    </div>
  );
}

export function StayTermsPanel({ value, patch }: { value: StayDefaults; patch: Patch }) {
  const set = (next: Partial<StayDefaults>) => patch({ stayDefaults: { ...value, ...next } });
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>Applies to every property</p>
      <p className={styles.panelHint}>
        A property can override its cancellation wording and pet rules under “Property text”.
      </p>
      <div className={styles.grid2}>
        <TextRow label="Check in from" value={value.checkInFrom} onChange={(checkInFrom) => set({ checkInFrom })} />
        <TextRow label="Check out by" value={value.checkOutBy} onChange={(checkOutBy) => set({ checkOutBy })} />
      </div>
      <TextBlock
        label="Default cancellation policy"
        value={value.cancellationPolicy}
        onChange={(cancellationPolicy) => set({ cancellationPolicy })}
      />
    </div>
  );
}
