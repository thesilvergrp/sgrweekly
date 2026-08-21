import { useState, type FormEvent } from 'react';
import { Icon } from '../../components/icons';
import { Button, LinkButton } from '../../components/ui/Button';
import { Checkbox, Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Notice';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { useSiteContent } from '../../app/content-context';
import { StayMap } from '../map/StayMap';
import { describeError } from '../../lib/errors';
import { sendContactMessage, validateContact } from '../../services/contact.service';
import type { Stay } from '../../types/domain';
import styles from './ContactSection.module.css';

interface ContactSectionProps {
  stays: Stay[];
}

/**
 * General enquiries.
 *
 * Posts to `/api/contact`, which relays through SES to the business inbox with
 * the sender's address as Reply-To. If that fails for any reason the form does
 * not pretend otherwise — it says so and offers the same prefilled `mailto:`
 * hand-off the site used before SES existed, so a visitor is never left with a
 * message that silently went nowhere.
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
  const [company, setCompany] = useState(''); // honeypot
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);

  const mailtoHref = () => {
    const body = [
      message.trim(),
      '',
      `— ${name.trim()}`,
      phone.trim() ? `Phone: ${phone.trim()}` : '',
      `Email: ${email.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');
    return `mailto:${business.email}?subject=${encodeURIComponent(
      `${topic} — ${name.trim()}`,
    )}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const input = { name, email, phone, topic, message, company };
    const found = validateContact(input);
    setErrors(found);
    if (!consent) found.consent = 'Please confirm we can reply to you.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    setFailure(null);
    try {
      await sendContactMessage(input);
      setSent(true);
    } catch (error) {
      setFailure(error);
    } finally {
      setSending(false);
    }
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
            {sent && (
              <Notice tone="success" title="Message sent">
                Thanks — that has landed in our inbox and we will reply to {email.trim()}{' '}
                {business.responseWindow}. If it is urgent, call {business.phone}.
              </Notice>
            )}

            {failure !== null && (
              <Notice
                tone="error"
                title="We could not send that"
                detail={describeError(failure).detail}
                actions={
                  <LinkButton href={mailtoHref()} size="sm" variant="quiet" iconStart="mail">
                    Send it by email instead
                  </LinkButton>
                }
              >
                Nothing was delivered. Use the button to send the same message from your own email
                app, or call {business.phone} and we will pick it up from there.
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

            {/* Honeypot: off-screen and hidden from assistive tech, so only a bot
                fills it. The server drops those and still answers 200. */}
            <div aria-hidden="true" className="u-visually-hidden">
              <label htmlFor="contact-company">Company (leave blank)</label>
              <input
                id="contact-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </div>

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
              <Button type="submit" size="lg" iconStart="mail" loading={sending} disabled={sent}>
                {sent ? 'Sent' : 'Send message'}
              </Button>
              <p className={styles.smallprint}>{contact.smallprint}</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
