import React, { useState } from 'react';
import './ImageTextSection.sass';
import { useLandingPage } from '../LandingPageContext';

interface ImageTextSectionProps {
  id: string;
  onRemove: (id: string) => void;
}

const ImageTextSection: React.FC<ImageTextSectionProps> = () => {
  const { data } = useLandingPage();
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  
  const sections = data.home.image_text?.sections || [];
  const overallTitle = data.home.image_text?.title;
  const placeholderUrl = 'https://d2sy0v7xyp1zo0.cloudfront.net/landing-image-placeholder.webp';
  
  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };
  
  const getImageSrc = (section: any, index: number) => {
    // If image failed to load, use placeholder
    if (imageErrors[index]) {
      return placeholderUrl;
    }
    
    // Check if we have valid image URLs (not empty strings)
    const webp = section?.image?.webp?.trim();
    const jpg = section?.image?.jpg?.trim();
    
    if (webp || jpg) {
      return webp || jpg;
    }
    
    // No valid image, use placeholder
    return placeholderUrl;
  };
  
  return (
    <section 
      className="image-text-section"
      style={{
        '--color-header': data.theme.colors.header,
        '--color-text': data.theme.colors.text,
      } as React.CSSProperties}
    >
      {overallTitle && (
        <div className="image-text-section__header">
          <h2 className="image-text-section__main-title">{overallTitle}</h2>
        </div>
      )}
      
      {sections.map((section, index) => (
        <div key={index} className="image-text-section__container">
          <div className="image-text-section__col-image">
            <div className="image-text-section__image-shadow"></div>
            <div className="image-text-section__image">
              <img 
                src={getImageSrc(section, index)} 
                alt={section?.image?.alt || 'Image placeholder'}
                className="image-text-section__image-actual"
                onError={() => handleImageError(index)}
              />
            </div>
          </div>
          
          <div className="image-text-section__text">
            <h3 className="image-text-section__title">
              {section?.title || 'Section Title'}
            </h3>
            <div 
              className="image-text-section__body"
              dangerouslySetInnerHTML={{ 
                __html: section?.body || 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.<br><br>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' 
              }}
            />
          </div>
        </div>
      ))}
    </section>
  );
};

export default ImageTextSection;
