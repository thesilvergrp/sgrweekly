import { useState, useEffect, useCallback, useRef } from 'react';
import type { Property } from './lib/types';
import { properties as staticProperties } from './lib/properties';
import { fetchProperties } from './lib/api';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PropertyGrid from './components/PropertyGrid';
import PropertyDetail from './components/PropertyDetail';
import AmenitiesSection from './components/AmenitiesSection';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

// All properties live in the catalog (and are searchable), but only this
// curated set is shown in the on-page "Our Portfolio" grid. Keyed by the
// immutable OwnerRez id so it survives external_name/slug edits.
const DISPLAYED_IDS = new Set<string>([
  '478121', // The Silver Suite I
  '476709', // The Silver Studio II
  '444166', // The Silver Hideaway
  '451644', // The Silver Chic Studio
  '428819', // The Silver Spot
  '395467', // The Silver Cottage
]);

export default function App() {
  // Seed with static catalog so first paint always has content. The OwnerRez
  // fetch replaces it once /api/properties responds; failures (e.g. corp
  // network blocking, OwnerRez down) silently leave the static list in place.
  const [properties, setProperties] = useState<Property[]>(staticProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    let cancelled = false;
    fetchProperties()
      .then((live) => {
        if (cancelled || live.length === 0) return;
        setProperties(live);
      })
      .catch((err) => {
        console.warn('[properties] using static fallback:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Open a property directly from a ?property=<slug> deep link (shared via the
  // Share button), then strip the param so the URL stays clean. Retries when the
  // live catalog loads in case the slug isn't in the static seed yet.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('property');
    if (!slug) {
      deepLinkHandled.current = true;
      return;
    }
    const match = properties.find((p) => p.slug === slug || p.id === slug);
    if (!match) return; // wait for the live catalog, then retry
    deepLinkHandled.current = true;
    setSelectedProperty(match);
    window.scrollTo({ top: 0 });
    params.delete('property');
    const qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  }, [properties]);

  const navigateTo = useCallback((sectionId: string) => {
    if (selectedProperty) {
      setSelectedProperty(null);
    }
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, selectedProperty ? 100 : 0);
    setActiveSection(sectionId);
  }, [selectedProperty]);

  const handleExplore = useCallback(() => {
    setSelectedProperty(null);
    setTimeout(() => {
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    setActiveSection('properties');
  }, []);

  const handleSelectProperty = useCallback((property: Property) => {
    setSelectedProperty(property);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackFromProperty = useCallback(() => {
    setSelectedProperty(null);
    setTimeout(() => {
      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    if (selectedProperty) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [selectedProperty]);

  if (selectedProperty) {
    return (
      <div className="min-h-screen bg-silver-900">
        <Navbar onNavigate={navigateTo} activeSection={activeSection} />
        <PropertyDetail property={selectedProperty} onBack={handleBackFromProperty} />
        <Footer onNavigate={navigateTo} />
      </div>
    );
  }

  const displayedProperties = properties.filter((p) => DISPLAYED_IDS.has(p.id));

  return (
    <div className="min-h-screen bg-silver-900">
      <Navbar onNavigate={navigateTo} activeSection={activeSection} />
      <Hero
        onExplore={handleExplore}
        properties={displayedProperties}
        onSelectProperty={handleSelectProperty}
      />
      <PropertyGrid properties={displayedProperties} onSelectProperty={handleSelectProperty} />
      <AmenitiesSection />
      <AboutSection />
      <ContactSection properties={displayedProperties} />
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
