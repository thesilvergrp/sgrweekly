import { useSiteContent } from '../../app/content-context';
import { Icon, toIconName } from '../../components/icons';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useInView } from '../../hooks/useInView';
import styles from './AboutSection.module.css';

export function AboutSection() {
  const { about } = useSiteContent();
  const { ref, inView } = useInView();

  return (
    <section className={styles.section} id="about" aria-labelledby="about-title">
      <div className="u-container">
        <SectionHeading
          index={about.index}
          overline={about.overline}
          title={about.title}
          id="about-title"
        />

        <div className={`${styles.layout} u-reveal`} data-visible={inView} ref={ref}>
          <div className={styles.prose}>
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
            <p className={styles.pullQuote}>{about.pullQuote}</p>
          </div>

          <ul className={styles.points}>
            {about.points.map((point) => (
              <li className={styles.point} key={point.title}>
                <span className={styles.pointIcon}>
                  <Icon name={toIconName(point.icon, 'sparkle')} size={22} />
                </span>
                <div>
                  <h3 className={styles.pointTitle}>{point.title}</h3>
                  <p className={styles.pointBody}>{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
