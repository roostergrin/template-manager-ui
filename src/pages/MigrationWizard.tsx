import React, { useEffect, useRef, useState } from 'react';
import { Search, CheckCircle, Map, Sparkles, Palette, Rocket } from 'lucide-react';
import { MigrationWizardProvider, useMigrationWizard } from '../contexts/MigrationWizardProvider';
import StickyProgressNav from '../components/MigrationWizard/StickyProgressNav';
import Step1Capture from '../components/MigrationWizard/Step1Capture';
import Step2Audit from '../components/MigrationWizard/Step2Audit';
import Step3Structure from '../components/MigrationWizard/Step3Structure';
import Step3_5Generate from '../components/MigrationWizard/Step3.5Generate';
import Step4Customize from '../components/MigrationWizard/Step4Customize';
import Step5Launch from '../components/MigrationWizard/Step5Launch';
import './MigrationWizard.sass';

const steps = [
  { id: 'capture', label: 'Capture', icon: 'Search' },
  { id: 'audit', label: 'Audit', icon: 'CheckCircle' },
  { id: 'structure', label: 'Structure', icon: 'Map' },
  { id: 'generate', label: 'Generate', icon: 'Sparkles' },
  { id: 'customize', label: 'Customize', icon: 'Palette' },
  { id: 'launch', label: 'Launch', icon: 'Rocket' },
];

const MigrationWizardContent: React.FC = () => {
  const { state, actions } = useMigrationWizard();
  const [activeSection, setActiveSection] = useState('capture');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const isScrolling = useRef(false);

  // Auto-scroll to section when step changes programmatically
  useEffect(() => {
    if (state.currentStep !== activeSection && !isScrolling.current) {
      scrollToSection(state.currentStep);
    }
  }, [state.currentStep]);

  const scrollToSection = (sectionId: string) => {
    const section = sectionRefs.current[sectionId];
    if (section) {
      isScrolling.current = true;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
  };

  const handleStepClick = (stepId: string) => {
    setActiveSection(stepId);
    actions.setCurrentStep(stepId as any);
    scrollToSection(stepId);
  };

  // Intersection Observer to track which section is in view
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isScrolling.current) {
          const sectionId = entry.target.getAttribute('data-section-id');
          if (sectionId) {
            setActiveSection(sectionId);
            actions.setCurrentStep(sectionId as any);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [actions]);

  // Auto-save on state changes
  useEffect(() => {
    const saveState = () => {
      try {
        localStorage.setItem('migration-wizard-state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save state:', error);
      }
    };

    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [state]);

  return (
    <div className="migration-wizard-page">
      <StickyProgressNav steps={steps} activeStep={activeSection} onStepClick={handleStepClick} />

      <div className="migration-wizard-page__header">
      </div>

      <div className="migration-wizard-page__sections">
        <section
          ref={(el) => (sectionRefs.current['capture'] = el)}
          data-section-id="capture"
          className="migration-wizard-page__section"
          id="section-capture"
        >
          <div className="section-header">
            <h2><Search size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Step 1: Capture</h2>
            <p>Let's grab your existing content</p>
          </div>
          <Step1Capture />
        </section>

        <section
          ref={(el) => (sectionRefs.current['audit'] = el)}
          data-section-id="audit"
          className="migration-wizard-page__section"
          id="section-audit"
        >
          <div className="section-header">
            <h2><CheckCircle size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Step 2: Audit</h2>
            <p>Let's review what we found</p>
          </div>
          <Step2Audit />
        </section>

        <section
          ref={(el) => (sectionRefs.current['structure'] = el)}
          data-section-id="structure"
          className="migration-wizard-page__section"
          id="section-structure"
        >
          <div className="section-header">
            <h2><Map size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Step 3: Structure</h2>
            <p>Choose your site architecture</p>
          </div>
          <Step3Structure />
        </section>

        <section
          ref={(el) => (sectionRefs.current['generate'] = el)}
          data-section-id="generate"
          className="migration-wizard-page__section"
          id="section-generate"
        >
          <div className="section-header">
            <h2><Sparkles size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Step 4: Generate</h2>
            <p>Create content from your scraped data</p>
          </div>
          <Step3_5Generate />
        </section>

        <section
          ref={(el) => (sectionRefs.current['customize'] = el)}
          data-section-id="customize"
          className="migration-wizard-page__section"
          id="section-customize"
        >
          <div className="section-header">
            <h2><Palette size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Step 5: Customize</h2>
            <p>Make it yours while we build</p>
          </div>
          <Step4Customize />
        </section>

        <section
          ref={(el) => (sectionRefs.current['launch'] = el)}
          data-section-id="launch"
          className="migration-wizard-page__section"
          id="section-launch"
        >
          <div className="section-header">
            <h2><Rocket size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> Step 6: Launch</h2>
            <p>Your new site is ready!</p>
          </div>
          <Step5Launch />
        </section>
      </div>
    </div>
  );
};

const MigrationWizard: React.FC = () => {
  return (
    <MigrationWizardProvider>
      <MigrationWizardContent />
    </MigrationWizardProvider>
  );
};

export default MigrationWizard;
