import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, TextArea, TextInput } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Notice } from '../../components/ui/Notice';
import { describeError } from '../../lib/errors';
import { formatDateLong, pluralise } from '../../lib/format';
import {
  EnquiryValidationError,
  submitEnquiry,
  validateEnquiry,
  type EnquiryInput,
} from '../../services/enquiry.service';
import { useBusiness } from '../../app/content-context';
import styles from './EnquiryDialog.module.css';

interface EnquiryDialogProps {
  open: boolean;
  onClose: () => void;
  stayId: string;
  stayName: string;
  arrival: Date;
  departure: Date;
  arrivalIso: string;
  departureIso: string;
  guests: number;
  pets: number;
  nights: number;
}

/**
 * Sends a booking enquiry straight to OwnerRez through `POST /api/inquiries`.
 *
 * The proxy rejects the request unless property_id, arrival, departure,
 * guest.first_name and guest.email_address are present, so the same rule runs
 * here first — the visitor sees a field-level error instead of a 400.
 *
 * This is the secondary path: guests who want to hold dates without going
 * through checkout. The primary path remains the OwnerRez widget handoff.
 */
export function EnquiryDialog({
  open,
  onClose,
  stayId,
  stayName,
  arrival,
  departure,
  arrivalIso,
  departureIso,
  guests,
  pets,
  nights,
}: EnquiryDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [sent, setSent] = useState(false);
  const business = useBusiness();

  const buildInput = (): EnquiryInput => ({
    stayId,
    arrival: arrivalIso,
    departure: departureIso,
    fullName,
    email,
    phone,
    guests,
    pets,
    message,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const input = buildInput();
    const errors = validateEnquiry(input);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFailure(null);
    try {
      await submitEnquiry(input);
      setSent(true);
    } catch (error) {
      if (error instanceof EnquiryValidationError) setFieldErrors(error.fields);
      else setFailure(error);
    } finally {
      setSubmitting(false);
    }
  };

  const friendly = failure ? describeError(failure) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sent ? 'Enquiry sent' : `Ask about ${stayName}`}
      subtitle={
        sent ? undefined : 'We will confirm the dates and send you a quote — no payment yet.'
      }
      footer={
        sent ? (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="enquiry-form" loading={submitting}>
              Send enquiry
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className={styles.done}>
          <Notice tone="success" title="That is with our team">
            We will reply to {email} {business.responseWindow}. If it is urgent, call {business.phone}.
          </Notice>
        </div>
      ) : (
        <form className={styles.form} id="enquiry-form" onSubmit={handleSubmit} noValidate>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Arrive</span>
              <span className={styles.summaryValue}>{formatDateLong(arrival)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Depart</span>
              <span className={styles.summaryValue}>{formatDateLong(departure)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Party</span>
              <span className={styles.summaryValue}>
                {pluralise(guests, 'guest')}
                {pets > 0 ? `, ${pluralise(pets, 'pet')}` : ''} · {pluralise(nights, 'night')}
              </span>
            </div>
          </div>

          <div className={styles.pair}>
            <Field label="Your name" required error={fieldErrors.fullName}>
              {(props) => (
                <TextInput
                  {...props}
                  name="name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              )}
            </Field>

            <Field label="Email" required error={fieldErrors.email}>
              {(props) => (
                <TextInput
                  {...props}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
          </div>

          <Field label="Phone" hint="Only if you would rather we called.">
            {(props) => (
              <TextInput
                {...props}
                type="tel"
                name="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            )}
          </Field>

          <Field label="Anything we should know?">
            {(props) => (
              <TextArea
                {...props}
                name="notes"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            )}
          </Field>

          {friendly && (
            <Notice tone="error" title={friendly.title} detail={friendly.detail}>
              {friendly.body} You can also email {business.email} directly.
            </Notice>
          )}
        </form>
      )}
    </Modal>
  );
}
