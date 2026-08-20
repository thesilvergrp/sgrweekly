import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { describeCapacity } from '../../lib/format';
import type { Stay } from '../../types/domain';
import styles from './StayFinder.module.css';

interface StayFinderProps {
  stays: Stay[];
  onOpen: (stay: Stay) => void;
  onBrowse: () => void;
}

const MAX_RESULTS = 6;

/**
 * Type-ahead over the whole catalog — including homes that are not in the
 * curated grid, which is the point of keeping every active property loaded.
 *
 * Implemented as an ARIA combobox: ↑/↓ move, Enter opens, Escape closes, and
 * the active option is announced through aria-activedescendant.
 */
export function StayFinder({ stays, onOpen, onBrowse }: StayFinderProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return stays
      .filter((stay) =>
        [stay.name, stay.address.locality, stay.kind, stay.summary]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, MAX_RESULTS);
  }, [stays, query]);

  const showList = open && query.trim().length > 0;

  const choose = (stay: Stay | undefined) => {
    if (!stay) return;
    setOpen(false);
    setQuery('');
    onOpen(stay);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!showList || matches.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(matches[activeIndex]);
    }
  };

  return (
    <div className={styles.finder} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${listId}-input`}>
          Find a home
        </label>
        <div className={styles.inputRow}>
          <Icon name="search" size={18} />
          <input
            id={`${listId}-input`}
            ref={inputRef}
            className={styles.input}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && matches.length > 0 ? `${listId}-option-${activeIndex}` : undefined}
            placeholder="Try a name, or a neighbourhood"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      <Button size="lg" iconStart="arrowRight" onClick={onBrowse}>
        Browse all homes
      </Button>

      {showList && (
        <div className={styles.results} id={listId} role="listbox" aria-label="Matching homes">
          {matches.length === 0 ? (
            <p className={styles.noResults}>
              Nothing matches “{query.trim()}”. Try a shorter word, or browse the full collection.
            </p>
          ) : (
            matches.map((stay, index) => (
              <button
                key={stay.id}
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={styles.option}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(stay)}
              >
                <span className={styles.optionName}>{stay.name}</span>
                <span className={styles.optionMeta}>
                  {stay.address.locality} · {describeCapacity(stay)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
