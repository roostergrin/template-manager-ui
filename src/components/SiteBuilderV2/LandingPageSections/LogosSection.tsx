import React from 'react';
import './LogosSection.sass';
import { useLandingPage } from '../LandingPageContext';

interface LogosSectionProps {
  id: string;
  onRemove: (id: string) => void;
}

const LogosSection: React.FC<LogosSectionProps> = () => {
  const { data } = useLandingPage();
  const logos = data.home.banner?.logos || [];
  
  const getLogoSrc = (logo: { format: string; icon: string; alt: string }) => {
    if (logo.format === 'link') {
      // Direct URL
      return logo.icon;
    } else {
      // SVG from assets/icons
      try {
        return new URL(`../../../assets/icons/${logo.icon}.svg`, import.meta.url).href;
      } catch (e) {
        console.error(`Failed to load icon: ${logo.icon}`, e);
        return '';
      }
    }
  };
  
  return (
    <section 
      className="logos-section"
      style={{
        '--color-primary': data.theme.colors.primary,
      } as React.CSSProperties}
    >
      <div className="logos-section__content">
        
        {logos.map((logo, index) => (
          <div key={index} className="logos-section__item">
            {logo.icon ? (
              <img 
                src={getLogoSrc(logo)} 
                alt={logo.alt}
                className="logos-section__image"
              />
            ) : (
              <div className="logos-section__placeholder">
                <span className="logos-section__placeholder-icon">🖼️</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default LogosSection;

