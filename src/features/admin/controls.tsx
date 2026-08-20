import { Button } from '../../components/ui/Button';
import { Field, TextArea, TextInput } from '../../components/ui/Field';
import type { FeatureItem } from '../../content/site-content';
import styles from './Admin.module.css';

/** Editable list of plain strings — paragraphs, topics, service areas, ids. */
export function StringListEditor({
  label,
  hint,
  values,
  onChange,
  multiline = false,
  addLabel = 'Add item',
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  multiline?: boolean;
  addLabel?: string;
}) {
  const update = (index: number, value: string) =>
    onChange(values.map((item, position) => (position === index ? value : item)));
  const remove = (index: number) => onChange(values.filter((_, position) => position !== index));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>{label}</p>
      {hint && <p className={styles.panelHint}>{hint}</p>}

      {values.map((value, index) => (
        <div className={styles.listItem} key={index}>
          <Field label={`${label} ${index + 1}`} required>
            {(props) =>
              multiline ? (
                <TextArea {...props} rows={4} value={value} onChange={(e) => update(index, e.target.value)} />
              ) : (
                <TextInput {...props} value={value} onChange={(e) => update(index, e.target.value)} />
              )
            }
          </Field>
          <div className={styles.listControls}>
            <Button variant="ghost" size="sm" onClick={() => move(index, -1)} disabled={index === 0}>
              Up
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => move(index, 1)}
              disabled={index === values.length - 1}
            >
              Down
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        </div>
      ))}

      <div>
        <Button variant="quiet" size="sm" iconStart="plus" onClick={() => onChange([...values, ''])}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

/** Editable list of icon/title/body cards. */
export function FeatureListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: FeatureItem[];
  onChange: (next: FeatureItem[]) => void;
}) {
  const update = (index: number, patch: Partial<FeatureItem>) =>
    onChange(values.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(values.filter((_, position) => position !== index));

  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>{label}</p>
      <p className={styles.panelHint}>
        Icon names come from the site icon set — for example <code>kitchen</code>, <code>game</code>,{' '}
        <code>parking</code>, <code>key</code>, <code>users</code>, <code>shield</code>,{' '}
        <code>compass</code>, <code>pool</code>, <code>wifi</code>. An unrecognised name falls back
        to a neutral glyph rather than breaking the page.
      </p>

      {values.map((item, index) => (
        <div className={styles.listItem} key={index}>
          <div className={styles.grid2}>
            <Field label="Title" required>
              {(props) => (
                <TextInput {...props} value={item.title} onChange={(e) => update(index, { title: e.target.value })} />
              )}
            </Field>
            <Field label="Icon" required>
              {(props) => (
                <TextInput {...props} value={item.icon} onChange={(e) => update(index, { icon: e.target.value })} />
              )}
            </Field>
          </div>
          <Field label="Body" required>
            {(props) => (
              <TextArea {...props} rows={3} value={item.body} onChange={(e) => update(index, { body: e.target.value })} />
            )}
          </Field>
          <div className={styles.listControls}>
            <Button variant="ghost" size="sm" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        </div>
      ))}

      <div>
        <Button
          variant="quiet"
          size="sm"
          iconStart="plus"
          onClick={() => onChange([...values, { icon: 'sparkle', title: '', body: '' }])}
        >
          Add card
        </Button>
      </div>
    </div>
  );
}

/** Single-line text field bound to a document path. */
export function TextRow({
  label,
  hint,
  value,
  onChange,
  required = true,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      {(props) => <TextInput {...props} value={value} onChange={(event) => onChange(event.target.value)} />}
    </Field>
  );
}

/** Multi-line text field bound to a document path. */
export function TextBlock({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  required = true,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      {(props) => (
        <TextArea {...props} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
}
