import { useState } from 'react';
import { Checkbox, Field, TextInput } from '../../components/ui/Field';
import { Tag } from '../../components/ui/Tag';
import type { StayEditorial, StaysContentDocument } from '../../content/stays-document';
import type { Stay } from '../../types/domain';
import { StringListEditor, TextBlock, TextRow } from './controls';
import styles from './Admin.module.css';

interface StaysPanelProps {
  document: StaysContentDocument;
  /** The live catalog, so the editor lists real properties by id. */
  stays: Stay[];
  onChange: (next: StaysContentDocument) => void;
}

/**
 * Per-stay editorial editor.
 *
 * Only editorial fields appear here. Address, bedrooms, bathrooms, sleeps and
 * display order are owned by OwnerRez and are shown read-only — letting the
 * content document contradict the booking system is how a guest ends up
 * booking a house that does not fit their party.
 */
export function StaysPanel({ document, stays, onChange }: StaysPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(stays[0]?.id ?? null);
  const selected = stays.find((stay) => stay.id === selectedId) ?? null;
  const entry: StayEditorial = (selectedId && document.stays[selectedId]) || {};

  const patch = (next: Partial<StayEditorial>) => {
    if (!selectedId) return;
    onChange({
      ...document,
      stays: { ...document.stays, [selectedId]: { ...entry, ...next } },
    });
  };

  return (
    <div className={styles.grid2}>
      <div className={styles.group}>
        <p className={styles.groupTitle}>Properties</p>
        <div className={styles.stayPicker}>
          {stays.map((stay) => (
            <button
              key={stay.id}
              type="button"
              className={styles.stayPick}
              aria-current={stay.id === selectedId ? 'true' : undefined}
              onClick={() => setSelectedId(stay.id)}
            >
              <span className={styles.stayPickName}>{stay.name}</span>
              <span className={styles.stayPickMeta}>
                {stay.address.locality} · id {stay.id}
                {document.stays[stay.id] ? ' · edited' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className={styles.panel}>
          <div className={styles.group}>
            <p className={styles.groupTitle}>From OwnerRez — read only</p>
            <p className={styles.panelHint}>
              {selected.address.full || selected.address.locality} · {selected.capacity.bedrooms}{' '}
              bed · {selected.capacity.bathrooms} bath · sleeps {selected.capacity.sleeps}
              {selected.capacity.areaSqFt ? ` · ${selected.capacity.areaSqFt} sq ft` : ''}
            </p>
            <div>
              <Tag tone={selected.source === 'live' ? 'available' : 'muted'}>
                {selected.source === 'live' ? 'Live data' : 'Offline copy'}
              </Tag>
            </div>
          </div>

          <div className={styles.group}>
            <p className={styles.groupTitle}>Editorial</p>
            <TextRow
              label="Display name"
              hint="The web address for this home does not change when you rename it, so existing shared links keep working."
              value={entry.displayName ?? selected.name}
              onChange={(displayName) => patch({ displayName })}
            />
            <TextBlock
              label="Summary"
              hint="One line, shown on cards and in search results."
              rows={2}
              value={entry.summary ?? selected.summary}
              onChange={(summary) => patch({ summary })}
            />
            <TextBlock
              label="Full description"
              hint="Blank lines separate paragraphs."
              rows={12}
              value={entry.story ?? selected.story}
              onChange={(story) => patch({ story })}
            />
            <Field label="Beds" hint="OwnerRez does not publish a bed count, so this one is ours.">
              {(props) => (
                <TextInput
                  {...props}
                  type="number"
                  min={0}
                  value={String(entry.bedCount ?? selected.capacity.beds)}
                  onChange={(event) => patch({ bedCount: Number(event.target.value) })}
                />
              )}
            </Field>
            <Checkbox
              checked={entry.spotlight ?? selected.spotlight}
              onChange={(event) => patch({ spotlight: event.target.checked })}
            >
              Show the “guest favourite” badge on this home
            </Checkbox>
          </div>

          <div className={styles.group}>
            <p className={styles.groupTitle}>Terms for this property</p>
            <p className={styles.panelHint}>
              Leave the cancellation box empty to use the site-wide wording from “Stay terms”.
            </p>
            <TextBlock
              label="Cancellation policy"
              rows={3}
              required={false}
              value={entry.cancellationPolicy ?? ''}
              onChange={(cancellationPolicy) => patch({ cancellationPolicy })}
            />
            <Checkbox
              checked={entry.petsAllowed ?? false}
              onChange={(event) => patch({ petsAllowed: event.target.checked })}
            >
              Pets are welcome at this property
            </Checkbox>
            {(entry.petsAllowed ?? false) && (
              <Field label="Maximum pets">
                {(props) => (
                  <TextInput
                    {...props}
                    type="number"
                    min={1}
                    value={String(entry.maxPets ?? 2)}
                    onChange={(event) => patch({ maxPets: Number(event.target.value) })}
                  />
                )}
              </Field>
            )}
          </div>

          <StringListEditor
            label="Amenities"
            hint="Names match the OwnerRez amenity vocabulary, which is what picks the icon."
            values={entry.amenityTags ?? selected.amenities}
            onChange={(amenityTags) => patch({ amenityTags })}
            addLabel="Add amenity"
          />

          <StringListEditor
            label="Photos"
            hint="Full https:// URLs, first one is the cover. Anything that is not http(s) is dropped when the document is read."
            values={entry.photos ?? selected.photos}
            onChange={(photos) => patch({ photos })}
            addLabel="Add photo URL"
          />
        </div>
      ) : (
        <p className={styles.panelHint}>No properties loaded.</p>
      )}
    </div>
  );
}
