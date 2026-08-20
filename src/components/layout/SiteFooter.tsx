import { BrandMark } from '../brand/BrandMark';
import { Icon } from '../icons';
import { useSiteContent } from '../../app/content-context';
import { sections } from '../../config/site';
import { scrollToTop } from '../../lib/scroll';
import styles from './SiteFooter.module.css';

interface SiteFooterProps {
  onNavigate: (sectionId: string) => void;
}

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  const { business, footer } = useSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`u-container ${styles.inner}`}>
        <div>
          <BrandMark inverse />
          <p className={styles.blurb}>{footer.blurb}</p>
        </div>

        <nav aria-labelledby="footer-nav-title">
          <h2 className={styles.columnTitle} id="footer-nav-title">
            {footer.exploreTitle}
          </h2>
          <ul className={styles.list}>
            {sections.map((section) => (
              <li key={section.id}>
                <button type="button" className={styles.link} onClick={() => onNavigate(section.id)}>
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={styles.columnTitle}>{footer.contactTitle}</h2>
          <ul className={styles.list}>
            <li>
              <a className={styles.link} href={business.phoneHref}>
                <Icon name="phone" size={15} />
                {business.phone}
              </a>
            </li>
            <li>
              <a className={styles.link} href={`mailto:${business.email}`}>
                <Icon name="mail" size={15} />
                {business.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={styles.columnTitle}>{footer.areasTitle}</h2>
          <p className={styles.areas}>
            {business.serviceAreas.join(' · ')}
            <br />
            {business.region}
          </p>
        </div>
      </div>

      <div className={`u-container ${styles.bar}`}>
        <p>© {year} {business.name}. All rights reserved.</p>
        <button type="button" className={styles.top} onClick={() => scrollToTop()}>
          <Icon name="arrowUp" size={14} />
          Back to top
        </button>
      </div>
    </footer>
  );
}
