import React from 'react';
import './FooterSection.sass';
import { useLandingPage } from '../LandingPageContext';
import rgLogo from '../../../assets/icons/rg-logo.svg';

interface FooterSectionProps {
  id: string;
  onRemove: (id: string) => void;
}

const FooterSection: React.FC<FooterSectionProps> = () => {
  const { data } = useLandingPage();
  
  return (
    <footer 
      className="footer-section"
      style={{
        '--color-footer': data.theme.colors.footer,
        '--color-text': data.theme.colors.text,
      } as React.CSSProperties}
    >
      <div className="footer-section__content">
        <p className="footer-section__text">{data['the-footer'].copyright.label}</p>
        <p className="footer-section__credit">
          <span>Online Advantage by Rooster Grin Media</span>
          <img 
            src={rgLogo} 
            alt="Rooster Grin Media Logo" 
            className="footer-section__logo"
          />
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;

