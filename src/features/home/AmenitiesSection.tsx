import { useSiteContent } from '../../app/content-context';
import { Icon, toIconName } from '../../components/icons';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useInView } from '../../hooks/useInView';
import styles from './AmenitiesSection.module.css';

export function AmenitiesSection() {
  const { amenities } = useSiteContent();
  const { ref, inView } = useInView<HTMLUListElement>();

  return (
    <section className={styles.section} id="amenities" aria-labelledby="amenities-title">
      <div className="u-container">
        <SectionHeading
          index={amenities.index}
          overline={amenities.overline}
          title={amenities.title}
          lede={amenities.lede}
          id="amenities-title"
        />

        <ul className={`${styles.grid} u-reveal`} data-visible={inView} ref={ref}>
          {amenities.items.map((item, index) => (
            <li className={styles.item} key={item.title}>
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.icon}>
                <Icon name={toIconName(item.icon, 'sparkle')} size={26} />
              </span>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.body}>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
