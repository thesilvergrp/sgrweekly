import { useState } from 'react';
import { Mail, MapPin, Clock, Phone, Send, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import type { Property } from '../lib/types';
import PropertyMap from './PropertyMap';

const INQUIRY_TOPICS = [
  'Booking a Vacation Rental',
  'Planning an Event',
  'General Question',
];

export default function ContactSection({ properties }: { properties: Property[] }) {
  const { ref, isVisible } = useScrollAnimation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: INQUIRY_TOPICS[0],
    message: '',
    agreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in name, email, and message.');
      return;
    }
    if (!formData.agreed) {
      setError('Please agree to the terms before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');

    // TODO: wire to OwnerRez contact/messaging API (or a transactional email
    // service) once backend integration lands. Payload: name, email, phone,
    // topic, message.
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitted(true);
    } catch {
      setError('Failed to send message. Please email us directly at Bookings@silvergrouprentals.com');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'Bookings@silvergrouprentals.com',
      href: 'mailto:Bookings@silvergrouprentals.com',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '(404) 779-0102',
      href: 'tel:+14047790102',
    },
    {
      icon: MapPin,
      label: 'Area',
      value: 'Atlanta, Acworth & Forest Park, GA',
      href: undefined,
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24 hours',
      href: undefined,
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-28 bg-silver-800/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-accent-400 text-sm font-semibold uppercase tracking-widest">Get In Touch</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-silver-50 mt-3 mb-4">
            Let's Plan Your <span className="text-gradient-warm">Perfect Stay</span>
          </h2>
          <p className="text-silver-400 max-w-xl mx-auto">
            Have questions or ready to book? Reach out and our team will help you find the ideal home.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                  <item.icon size={18} className="text-accent-400" />
                </div>
                <div>
                  <div className="text-silver-500 text-sm mb-0.5">{item.label}</div>
                  {item.href ? (
                    <a href={item.href} className="text-silver-200 hover:text-accent-300 transition-colors text-sm font-medium">
                      {item.value}
                    </a>
                  ) : (
                    <div className="text-silver-200 text-sm font-medium">{item.value}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Interactive map of where the homes are */}
            <div className="mt-8">
              <PropertyMap properties={properties} />
              <p className="text-silver-600 text-xs mt-2 text-center">
                Serving the greater Atlanta area — Atlanta, Acworth &amp; Forest Park, GA
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white border border-silver-700 rounded-2xl p-8 text-center shadow-sm">
                <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-silver-50 mb-2">Message Sent!</h3>
                <p className="text-silver-300 text-sm">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-silver-700 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-silver-400 text-sm mb-1.5 block">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-white border border-silver-600 rounded-xl text-silver-100 text-sm placeholder-silver-400 focus:outline-none focus:border-accent-700 focus:ring-2 focus:ring-accent-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-silver-400 text-sm mb-1.5 block">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-white border border-silver-600 rounded-xl text-silver-100 text-sm placeholder-silver-400 focus:outline-none focus:border-accent-700 focus:ring-2 focus:ring-accent-200 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-silver-400 text-sm mb-1.5 block">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-white border border-silver-600 rounded-xl text-silver-100 text-sm placeholder-silver-400 focus:outline-none focus:border-accent-700 focus:ring-2 focus:ring-accent-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-silver-400 text-sm mb-1.5 block">What can we help with?</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData(p => ({ ...p, topic: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-silver-600 rounded-xl text-silver-100 text-sm focus:outline-none focus:border-accent-700 focus:ring-2 focus:ring-accent-200 transition-all"
                    >
                      {INQUIRY_TOPICS.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-silver-400 text-sm mb-1.5 block">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us about your trip or ask any questions..."
                    rows={5}
                    className="w-full px-4 py-3 bg-silver-900/50 border border-silver-700/40 rounded-xl text-silver-200 text-sm placeholder-silver-600 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 text-silver-400 text-xs leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreed}
                    onChange={(e) => setFormData(p => ({ ...p, agreed: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-silver-600 bg-silver-900 text-accent-500 focus:ring-accent-500/30 focus:ring-offset-0"
                  />
                  <span>
                    I agree to be contacted by Silver Group Rentals about my inquiry. We don't share your
                    info with third parties.
                  </span>
                </label>

                {error && (
                  <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-accent-800 hover:bg-accent-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-accent-800/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
