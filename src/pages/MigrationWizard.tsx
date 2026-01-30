import React, { useEffect, useRef, useState } from 'react';
import { Search, CheckCircle, Map, Sparkles } from 'lucide-react';
import { MigrationWizardProvider, useMigrationWizard } from '../contexts/MigrationWizardProvider';
import StickyProgressNav from '../components/MigrationWizard/StickyProgressNav';
import Step1Capture from '../components/MigrationWizard/Step1Capture';
import Step2Audit from '../components/MigrationWizard/Step2Audit';
import Step3Container from '../components/MigrationWizard/Step3/Step3Container';
import Step4Generate from '../components/MigrationWizard/Step4Generate';
import './MigrationWizard.sass';

const steps = [
  { id: 'capture', label: 'Capture', icon: 'Search' },
  { id: 'audit', label: 'Audit', icon: 'CheckCircle' },
  { id: 'structure', label: 'Structure', icon: 'Map' },
  { id: 'generate', label: 'Generate', icon: 'Sparkles' },
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

  // Auto-save on state changes (exclude large data to avoid quota issues)
  useEffect(() => {
    const saveState = () => {
      try {
        // Create a lighter version of state without large data
        const stateToSave = {
          ...state,
          // Don't save the full allocated sitemap (too large for localStorage)
          allocatedSitemap: state.allocatedSitemap ? {
            allocation_summary: state.allocatedSitemap.allocation_summary,
            // Store just metadata, not full pages with markdown
            pageCount: Object.keys(state.allocatedSitemap.pages || {}).length
          } : null,
          // Don't save full scraped content (too large)
          scrapedContent: state.scrapedContent ? {
            success: state.scrapedContent.success,
            domain: state.scrapedContent.domain,
            metadata: state.scrapedContent.metadata
          } : null,
        };
        localStorage.setItem('migration-wizard-state', JSON.stringify(stateToSave));
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
            <p>Select template, sitemap, allocate markdown, and generate</p>
          </div>
          <Step3Container />
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
          <Step4Generate />
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
