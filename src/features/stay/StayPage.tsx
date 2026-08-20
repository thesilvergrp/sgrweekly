import { useMemo, useState } from 'react';
import { Icon } from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/toast-context';
import { resolveStayPolicies } from '../../content/policies';
import { EnquiryDialog } from '../booking/EnquiryDialog';
import { ReservationHandoffDialog } from '../booking/ReservationHandoffDialog';
import { ReservationPanel } from '../booking/ReservationPanel';
import { useReservationDraft } from '../booking/useReservationDraft';
import { useStayAvailability } from '../booking/useStayAvailability';
import { useStayPricing } from '../booking/useStayPricing';
import { StayMap } from '../map/StayMap';
import { amenityIcon } from '../../lib/amenity-icons';
import { describeBedrooms, describeCapacity, formatDate, pluralise } from '../../lib/format';
import { shareStay } from '../../lib/share';
import { today } from '../../lib/dates';
import type { Stay } from '../../types/domain';
import { cx } from '../../lib/cx';
import { StayGallery } from './StayGallery';
import { StayPoliciesPanel } from './StayPolicies';
import styles from './StayPage.module.css';

interface StayPageProps {
  stay: Stay;
  onBack: () => void;
}

/**
 * Detail view for one stay. Composition, not a monolith: gallery, narrative,
 * amenities, location and policies are separate pieces, and every backend
 * interaction is behind a hook in features/booking.
 */
export function StayPage({ stay, onBack }: StayPageProps) {
  const policies = useMemo(
    () => resolveStayPolicies(stay.id, stay.capacity.sleeps),
    [stay.id, stay.capacity.sleeps],
  );

  const availability = useStayAvailability(stay.id);
  const [visibleMonth, setVisibleMonth] = useState(() => today());
  const pricing = useStayPricing(stay.id, visibleMonth);
  const draft = useReservationDraft(stay, availability.index, policies.petsAllowed, policies.maxPets);

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { notify } = useToast();

  const handleShare = async () => {
    const outcome = await shareStay(stay.name, stay.slug);
    if (outcome === 'copied') notify('Link copied to your clipboard');
    if (outcome === 'failed') notify('We could not copy that link', 'error');
  };

  const panel = (bare: boolean) => (
    <ReservationPanel
      bare={bare}
      stay={stay}
      policies={policies}
      draft={draft}
      availability={availability.index}
      availabilityLoading={availability.isLoading}
      availabilityDegraded={availability.degraded}
      rates={pricing.rates}
      ratesAvailable={!pricing.unavailable}
      onVisibleMonthChange={setVisibleMonth}
      onReserve={() => {
        setSheetOpen(false);
        setHandoffOpen(true);
      }}
      onEnquire={() => {
        setSheetOpen(false);
        setEnquiryOpen(true);
      }}
    />
  );

  return (
    <div className={styles.page}>
      <div className={styles.crumbBar}>
        <div className={cx('u-container', styles.crumbInner)}>
          <Button variant="ghost" size="sm" iconStart="arrowLeft" onClick={onBack}>
            All homes
          </Button>
          <span className={styles.crumbName}>{stay.name}</span>
        </div>
      </div>

      <div className={cx('u-container', styles.hero)}>
        <StayGallery name={stay.name} photos={stay.photos} />

        <header className={styles.title}>
          <div>
            <p className={styles.locality}>
              <Icon name="pin" size={13} />
              {stay.address.locality}
            </p>
            <h1 className={styles.name}>{stay.name}</h1>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <Icon name="bed" size={16} />
                <dt>Bedrooms</dt>
                <dd>{describeBedrooms(stay.capacity.bedrooms)}</dd>
              </div>
              <div className={styles.fact}>
                <Icon name="home" size={16} />
                <dt>Beds</dt>
                <dd>{pluralise(stay.capacity.beds, 'bed')}</dd>
              </div>
              <div className={styles.fact}>
                <Icon name="bath" size={16} />
                <dt>Bathrooms</dt>
                <dd>{pluralise(stay.capacity.bathrooms, 'bath')}</dd>
              </div>
              <div className={styles.fact}>
                <Icon name="users" size={16} />
                <dt>Sleeps</dt>
                <dd>Sleeps {stay.capacity.sleeps}</dd>
              </div>
              {stay.capacity.areaSqFt && (
                <div className={styles.fact}>
                  <Icon name="compass" size={16} />
                  <dt>Size</dt>
                  <dd className="u-numeric">{stay.capacity.areaSqFt.toLocaleString()} sq ft</dd>
                </div>
              )}
            </dl>
          </div>

          <div className={styles.titleActions}>
            <Button variant="quiet" size="sm" iconStart="share" onClick={handleShare}>
              Share
            </Button>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.main}>
            <StoryBlock story={stay.story} />

            {stay.amenities.length > 0 && (
              <section className={styles.block} aria-labelledby="amenities-heading">
                <h2 className={styles.blockTitle} id="amenities-heading">
                  What is in the house
                </h2>
                <ul className={styles.amenities}>
                  {stay.amenities.map((amenity) => (
                    <li className={styles.amenity} key={amenity}>
                      <span className={styles.amenityIcon}>
                        <Icon name={amenityIcon(amenity)} size={18} />
                      </span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* On narrow screens the reservation panel reads better here than
                in a sidebar that would otherwise sit below everything. */}
            <section className={cx(styles.block, styles.mobilePanel)} aria-label="Check availability">
              {panel(true)}
            </section>

            <section className={styles.block} aria-labelledby="location-heading">
              <h2 className={styles.blockTitle} id="location-heading">
                Where you will be
              </h2>
              <p className={styles.address}>{stay.address.full}</p>
              <div className={styles.mapWrap}>
                <StayMap stays={[stay]} showList={false} caption="Exact address is shared once your booking is confirmed." />
              </div>
            </section>

            <section className={styles.block} aria-labelledby="policies-heading">
              <h2 className={styles.blockTitle} id="policies-heading">
                Before you book
              </h2>
              <StayPoliciesPanel policies={policies} />
            </section>
          </div>

          <aside className={cx(styles.aside, styles.desktopPanel)} aria-label="Check availability">
            <div className={styles.asideSticky}>{panel(false)}</div>
          </aside>
        </div>
      </div>

      <div className={styles.dock}>
        <span className={styles.dockText}>
          <span className={styles.dockTitle}>
            {draft.isComplete && draft.arrival && draft.departure
              ? `${formatDate(draft.arrival)} → ${formatDate(draft.departure)}`
              : 'Weekly stays'}
          </span>
          <span className={styles.dockSub}>{describeCapacity(stay)}</span>
        </span>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          {draft.isComplete ? 'Review' : 'Check dates'}
        </Button>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Check availability"
        subtitle={stay.name}
      >
        {panel(true)}
      </Modal>

      {draft.isComplete && draft.arrivalIso && draft.departureIso && (
        <ReservationHandoffDialog
          open={handoffOpen}
          onClose={() => setHandoffOpen(false)}
          stayName={stay.name}
          stayId={stay.id}
          arrival={draft.arrivalIso}
          departure={draft.departureIso}
          guests={draft.guests}
          pets={draft.pets}
        />
      )}

      {draft.isComplete && draft.arrival && draft.departure && draft.arrivalIso && draft.departureIso && (
        <EnquiryDialog
          open={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          stayId={stay.id}
          stayName={stay.name}
          arrival={draft.arrival}
          departure={draft.departure}
          arrivalIso={draft.arrivalIso}
          departureIso={draft.departureIso}
          guests={draft.guests}
          pets={draft.pets}
          nights={draft.nights}
        />
      )}
    </div>
  );
}

function StoryBlock({ story }: { story: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = story.length > 640;

  return (
    <section className={styles.block} aria-labelledby="story-heading">
      <h2 className={styles.blockTitle} id="story-heading">
        About this home
      </h2>
      <p className={cx(styles.prose, long && !expanded && styles.clamped)}>{story}</p>
      {long && (
        <Button variant="link" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Show less' : 'Read the full description'}
        </Button>
      )}
    </section>
  );
}
