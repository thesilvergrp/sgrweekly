import { useState, type FormEvent } from 'react';
import { Icon } from '../../components/icons';
import { Button, LinkButton } from '../../components/ui/Button';
import { Checkbox, Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Notice';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useSiteContent } from '../../app/content-context';
import { StayMap } from '../map/StayMap';
import type { Stay } from '../../types/domain';
import styles from './ContactSection.module.css';

interface ContactSectionProps {
  stays: Stay[];
}

/**
 * General enquiries.
 *
 * There is deliberately NO backend endpoint behind this form: the proxy exposes
 * only property-scoped inquiries (which need a property id and dates), and no
 * SES or messaging integration exists. Rather than pretending a message was
 * transmitted — which is what the previous implementation did with a 600ms
 * timer — this composes a prefilled email and hands it to the visitor's mail
 * client, then shows the address so they can always finish the job manually.
 */
export function ContactSection({ stays }: ContactSectionProps) {
  const { business, contact } = useSiteContent();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState(contact.topics[0]);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [handedOff, setHandedOff] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Tell us who you are.';
    if (!email.trim()) next.email = 'We need somewhere to reply.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'That address looks incomplete.';
    if (!message.trim()) next.message = 'Let us know what you need.';
    if (!consent) next.consent = 'Please confirm we can reply to you.';
    return next;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = [
      message.trim(),
      '',
      `— ${name.trim()}`,
      phone.trim() ? `Phone: ${phone.trim()}` : '',
      `Email: ${email.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');

    window.location.href = `mailto:${business.email}?subject=${encodeURIComponent(
      `${topic} — ${name.trim()}`,
    )}&body=${encodeURIComponent(body)}`;
    setHandedOff(true);
  };

  return (
    <section className={styles.section} id="contact" aria-labelledby="contact-title">
      <div className="u-container">
        <SectionHeading
          index={contact.index}
          overline={contact.overline}
          title={contact.title}
          lede={contact.lede}
          id="contact-title"
        />

        <div className={styles.layout}>
          <div className={styles.details}>
            <div className={styles.detail}>
              <span className={styles.detailIcon}>
                <Icon name="phone" size={20} />
              </span>
              <div>
                <span className={styles.detailLabel}>Call or text</span>
                <a className={styles.detailValue} href={business.phoneHref}>
                  {business.phone}
                </a>
              </div>
            </div>

            <div className={styles.detail}>
              <span className={styles.detailIcon}>
                <Icon name="mail" size={20} />
              </span>
              <div>
                <span className={styles.detailLabel}>Email</span>
                <a className={styles.detailValue} href={`mailto:${business.email}`}>
                  {business.email}
                </a>
              </div>
            </div>

            <div className={styles.detail}>
              <span className={styles.detailIcon}>
                <Icon name="clock" size={20} />
              </span>
              <div>
                <span className={styles.detailLabel}>Reply time</span>
                <span className={styles.detailValue}>Usually {business.responseWindow}</span>
              </div>
            </div>

            <div className={styles.map}>
              <StayMap
                stays={stays}
                caption={`Homes across ${business.serviceAreas.join(', ')} — ${business.region}.`}
              />
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {handedOff && (
              <Notice
                tone="success"
                title="Your email is ready to send"
                actions={
                  <LinkButton href={`mailto:${business.email}`} size="sm" variant="quiet" iconStart="mail">
                    Open it again
                  </LinkButton>
                }
              >
                We opened a prefilled message in your email app. If nothing happened, write to{' '}
                {business.email} or call {business.phone} and we will pick it up from there.
              </Notice>
            )}

            <div className={styles.pair}>
              <Field label="Your name" required error={errors.name}>
                {(props) => (
                  <TextInput
                    {...props}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                )}
              </Field>

              <Field label="Email" required error={errors.email}>
                {(props) => (
                  <TextInput
                    {...props}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                )}
              </Field>
            </div>

            <div className={styles.pair}>
              <Field label="Phone">
                {(props) => (
                  <TextInput
                    {...props}
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                )}
              </Field>

              <Field label="What is it about" required>
                {(props) => (
                  <SelectInput {...props} value={topic} onChange={(event) => setTopic(event.target.value)}>
                    {contact.topics.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                )}
              </Field>
            </div>

            <Field label="Message" required error={errors.message}>
              {(props) => (
                <TextArea
                  {...props}
                  rows={5}
                  placeholder="Dates you have in mind, how many of you, anything that would make or break the stay."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              )}
            </Field>

            <Checkbox checked={consent} onChange={(event) => setConsent(event.target.checked)}>
              You can contact me about this enquiry. We never pass details to anyone else.
              {errors.consent && (
                <>
                  <br />
                  <span style={{ color: 'var(--rust)' }}>{errors.consent}</span>
                </>
              )}
            </Checkbox>

            <div className={styles.actions}>
              <Button type="submit" size="lg" iconStart="mail">
                Compose the email
              </Button>
              <p className={styles.smallprint}>{contact.smallprint}</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
