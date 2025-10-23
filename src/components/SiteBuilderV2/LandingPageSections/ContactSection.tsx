import React from 'react';
import './ContactSection.sass';
import { useLandingPage } from '../LandingPageContext';

interface ContactSectionProps {
  id: string;
  onRemove: (id: string) => void;
}

const ContactSection: React.FC<ContactSectionProps> = () => {
  const { data } = useLandingPage();
  
  return (
    <section 
      className="contact-section"
      style={{
        '--color-background': data.theme.colors.background,
        '--color-button': data.theme.colors.button,
        '--color-hover': data.theme.colors.hover,
        '--color-header': data.theme.colors.header,
        '--color-text': data.theme.colors.text,
      } as React.CSSProperties}
    >
      <div className="contact-section__content">
        <div className="contact-section__left">
          <h2 
            className="contact-section__title"
            dangerouslySetInnerHTML={{ __html: data.home.form?.tagline || "We'd love to hear from you!" }}
          />
          <h3 className="contact-section__subtitle">{data['global-data'].title}</h3>
          
          <div className="contact-section__divider"></div>
          
          <div className="contact-section__info">
            <p className="contact-section__detail">{data['global-data'].email.label}</p>
            <p 
              className="contact-section__detail"
              dangerouslySetInnerHTML={{ __html: data['global-data'].address.label.replace(/<br>/g, ' ') }}
            />
            <p className="contact-section__detail">{data['global-data'].phone.label}</p>
          </div>
        </div>
        
        <div className="contact-section__right">
          <div className="contact-section__col-form">
          <div className="contact-section__dots"></div>
            <form className="contact-section__form">
              
                <input 
                  type="text" 
                  className="contact-section__input"
                  placeholder="First Name *"
                  readOnly
                />
                <input 
                  type="text" 
                  className="contact-section__input"
                  placeholder="Last Name *"
                  readOnly
                />
              
                <input 
                  type="email" 
                  className="contact-section__input"
                  placeholder="Your Email Address *"
                  readOnly
                />
                <input 
                  type="tel" 
                  className="contact-section__input"
                  placeholder="Your Phone Number *"
                  readOnly
                />
    
              <textarea 
                className="contact-section__textarea"
                placeholder="Message"
                readOnly
              />
              
              {data.form.optIn?.message && (
                <label className="contact-section__opt-in">
                  <input 
                    type="checkbox" 
                    className="contact-section__checkbox"
                  />
                  <span className="contact-section__opt-in-text">
                    {data.form.optIn.message || 'By providing your phone number, you agree to receive text messages from Example Orthodontics. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out.'}
                  </span>
                </label>
              )}
              
              <button type="button" className="contact-section__submit">SUBMIT</button>
            </form>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

