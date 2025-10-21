import React from 'react';
import './HeroSection.sass';
import { useLandingPage } from '../LandingPageContext';
import invisalignLogo from '../../../assets/icons/invisalign.svg';

interface HeroSectionProps {
  id: string;
  onRemove: (id: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const { data } = useLandingPage();
  
  const backgroundImage = data.home.hero?.image?.webp || data.home.hero?.image?.jpg || 'https://d2sy0v7zyp1zo0.cloudfront.net/landing-bg-3.webp';
  const logoSrc = data['global-data'].logo || invisalignLogo;
  
  return (
    <section 
      className="hero-section"
      style={{
        '--color-primary': data.theme.colors.primary,
        '--color-secondary': data.theme.colors.secondary,
        '--color-button': data.theme.colors.button,
        '--color-hover': data.theme.colors.hover,
        '--hero-bg-image': `url(${backgroundImage})`,
        '--color-hero-text': data.theme.colors.heroText,
      } as React.CSSProperties}
    >
      <div className="hero-section__container">
        <div className="hero-section__content">
        <div className="hero-section__left">
          <h1 
            className="hero-section__title"
            dangerouslySetInnerHTML={{ __html: data.home.hero?.tagline || 'New site coming soon!' }}
          />
          
          <div className="hero-section__logo">
            <img
              src={logoSrc} 
              alt={`${data['global-data'].title} logo`}
              className="hero-section__logo-image"
            />
          </div>
          
          
            <p className="hero-section__doctor">{data.home.hero.secondary_tagline || 'Dr. Somebody Somebody'}</p>
          
          <button className="hero-section__cta">
            {data.home.hero?.button || 'Contact Us'}
          </button>
        </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
